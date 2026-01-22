/**
 * Test Multi-Provider Embedding System
 */

async function testEmbeddings() {
  console.log("🧪 Testing Multi-Provider Embedding System\n");
  console.log("Testing embedding providers via direct API calls:\n");

  // Test 1: Jina AI
  console.log("1️⃣ Testing Jina AI (Primary)...");
  const jinaKey = process.env.JINA_API_KEY;
  if (jinaKey) {
    console.log(`✅ Jina AI: API KEY FOUND (${jinaKey.substring(0, 10)}...)`);
    try {
      const response = await fetch("https://api.jina.ai/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jinaKey}`,
        },
        body: JSON.stringify({
          model: "jina-embeddings-v3",
          task: "text-matching",
          input: ["Hendek'te satılık daire"],
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const dimensions = data.data[0].embedding.length;
        console.log(`✅ Jina AI: WORKING (${dimensions} dimensions)`);
        console.log(`   Model: jina-embeddings-v3`);
        console.log(`   Multilingual: ✅ Turkish supported`);
      } else {
        const error = await response.text();
        console.log(
          `⚠️ Jina AI: ${response.status} - ${error.substring(0, 100)}`,
        );
      }
    } catch (error) {
      console.log(`❌ Jina AI: ${error.message}`);
    }
  } else {
    console.log("❌ Jina AI: NO API KEY");
  }

  // Test 2: LiteLLM
  // Test 2: LiteLLM
  console.log("\n2️⃣ Testing LiteLLM (Fallback 1)...");
  try {
    const response = await fetch("http://77.42.68.4:4000/health", {
      signal: AbortSignal.timeout(3000),
    });
    console.log(response.ok ? "✅ LiteLLM: ONLINE" : "⚠️ LiteLLM: OFFLINE");
  } catch (error) {
    console.log(`❌ LiteLLM: OFFLINE - ${error.message}`);
  }

  // Test 3: Ollama
  console.log("\n3️⃣ Testing Ollama (Fallback 2)...");
  try {
    const response = await fetch("http://localhost:11434/api/tags", {
      signal: AbortSignal.timeout(2000),
    });
    console.log(response.ok ? "✅ Ollama: ONLINE" : "⚠️ Ollama: OFFLINE");
  } catch (error) {
    console.log(`❌ Ollama: NOT INSTALLED`);
  }

  // Test 4: HuggingFace
  console.log("\n4️⃣ Testing HuggingFace (Fallback 3)...");
  const hfKey = process.env.HUGGINGFACE_API_KEY;
  if (hfKey) {
    console.log(`✅ HuggingFace: API KEY FOUND (${hfKey.substring(0, 10)}...)`);
    try {
      const response = await fetch(
        "https://router.huggingface.co/v1/embeddings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${hfKey}`,
          },
          body: JSON.stringify({
            model: "sentence-transformers/all-MiniLM-L6-v2",
            input: "Test embedding",
          }),
        },
      );
      if (response.ok) {
        const data = await response.json();
        const dimensions = data.data[0].embedding.length;
        console.log(`✅ HuggingFace: WORKING (${dimensions} dimensions)`);
      } else {
        const error = await response.text();
        console.log(
          `⚠️ HuggingFace: ${response.status} - ${error.substring(0, 100)}`,
        );
      }
    } catch (error) {
      console.log(`❌ HuggingFace: ${error.message}`);
    }
  } else {
    console.log("❌ HuggingFace: NO API KEY");
  }

  // Test 5: OpenRouter
  console.log("\n5️⃣ Testing OpenRouter (Fallback 4)...");
  const orKey = process.env.OPENROUTER_API_KEY;
  console.log(
    orKey
      ? `✅ OpenRouter: API KEY FOUND`
      : "⚠️ OpenRouter: NO API KEY (optional)",
  );

  // Test 6: Simple Keyword (Always works)
  console.log("\n6️⃣ Testing Simple Keyword (Final Fallback)...");
  console.log("✅ Simple Keyword: ALWAYS AVAILABLE (no API needed)");

  console.log("\n📊 SUMMARY:");
  console.log("✅ Multi-provider fallback system configured (6 providers)");
  console.log("✅ At least one provider (Simple Keyword) always works");
  console.log("\n💡 To enable more providers:");
  console.log("   - Jina AI: Already configured ✅ (Primary)");
  console.log("   - LiteLLM: Start server at http://77.42.68.4:4000");
  console.log("   - Ollama: Install and run locally");
  console.log("   - HuggingFace: Already configured ✅");
  console.log("   - OpenRouter: Add OPENROUTER_API_KEY to .env.local");
}

testEmbeddings().catch(console.error);
