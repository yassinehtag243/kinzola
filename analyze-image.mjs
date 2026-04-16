import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";

async function main() {
  const zai = await ZAI.create();
  const imagePath = "/home/z/my-project/upload/IMG-20260414-WA0083.jpg";
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");
  const mimeType = "image/jpeg";

  const response = await zai.chat.completions.createVision({
    model: "glm-4.6v",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Describe every UI element in this screenshot in extreme detail. Focus on: chat messages, context menus, buttons (Copy, Forward, Delete, Reply, etc.), app navigation, icons, toolbars, and any text content visible. List every element you see."
          },
          {
            type: "image_url",
            image_url: {
              url: "data:" + mimeType + ";base64," + base64Image
            }
          }
        ]
      }
    ],
    thinking: { type: "disabled" }
  });

  const reply = response.choices?.[0]?.message?.content;
  console.log(reply ?? JSON.stringify(response, null, 2));
}

main().catch(e => console.error("Error:", e?.message || e));
