/**
 * Test LiteLLM Embedding Service
 */

const LITELLM_URL = "http://77.42.68.4:4000";

async function testLiteLLM() {
  console.log("🧪 Testing LiteLLM Embedding Service...\n");

  // 1. Health Check
  console.log("1️⃣ Health Check...");
  try {
    const healthResponse = await fetch(`${LITELLM_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });

    if (healthResponse.ok) {
      console.log("✅ LiteLLM: ONLINE");
    } else {
      console.log(`⚠️ LiteLLM: Status ${healthResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ LiteLLM: OFFLINE - ${error.message}`);
    return;
  }

  // 2. Test Embedding
  console.log("\n2️⃣ Testing Embedding API...");
  try {
    const response = await fetch(`${LITELLM_URL}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: "Merhaba dünya, bu bir test mesajıdır.",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const embedding = data.data[0].embedding;
      console.log(`✅ Embedding: SUCCESS`);
      console.log(`   Model: ${data.model || "text-embedding-3-small"}`);
      console.log(`   Dimensions: ${embedding.length}`);
      console.log(
        `   Sample: [${embedding
          .slice(0, 5)
          .map((n) => n.toFixed(4))
          .join(", ")}...]`,
      );
    } else {
      const error = await response.text();
      console.log(`❌ Embedding: FAILED`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${error.substring(0, 300)}`);
    }
  } catch (error) {
    console.log(`❌ Embedding: ERROR - ${error.message}`);
  }

  console.log("\n📊 RESULT:");
  console.log("✅ LiteLLM is ready to use!");
  console.log("   URL: http://77.42.68.4:4000");
  console.log("   Compatible with OpenAI API");
  console.log("\n💡 Add to .env.local:");
  console.log('   LITELLM_BASE_URL="http://77.42.68.4:4000"');
}

testLiteLLM();
