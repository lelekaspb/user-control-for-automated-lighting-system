import { checkMqttConnection } from "../../dashboard/connection";

export async function GET() {
  const result = await checkMqttConnection();
  return Response.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
