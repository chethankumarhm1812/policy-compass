import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://wymqtwtulrtevztrfcjg.supabase.co",
  "sb_secret_1Wu8iZyTmR_rUk7_sGkZeQ_F2EmmxH3"
);

async function generateEmbedding(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not set");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/embedding-001",
        content: { parts: [{ text }] },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Embedding API failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.embedding?.values;
}

async function run() {
  console.log("Loading policies from database...");

  const { data, error } = await supabase.from("policies").select("*");

  if (error) {
    console.error("Error fetching policies:", error);
    return;
  }

  console.log(`Found ${data.length} policies. Generating embeddings...`);

  for (const p of data) {
    try {
      const text = `${p.title} ${p.description} ${Array.isArray(p.benefits) ? p.benefits.join(" ") : p.benefits || ""}`;

      const embedding = await generateEmbedding(text);

      if (!embedding) {
        console.warn(`Skipping ${p.title}: No embedding returned`);
        continue;
      }

      const { error: updateError } = await supabase
        .from("policies")
        .update({ embedding })
        .eq("id", p.id);

      if (updateError) {
        console.error(`Error updating ${p.title}:`, updateError);
      } else {
        console.log(`✅ Updated: ${p.title}`);
      }

      // Rate limiting - wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      console.error(`Error processing ${p.title}:`, err);
    }
  }

  console.log("Embedding generation complete!");
}

run();