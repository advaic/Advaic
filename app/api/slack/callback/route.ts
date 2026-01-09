import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const SLACK_CLIENT_ID = "8782700628515.9149893466422";
const SLACK_CLIENT_SECRET = "02e346e46775bdac0b86d41650103438";
const SLACK_REDIRECT_URI = "http://localhost:3000/api/slack/callback";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect("/benachrichtigungen?error=access_denied");
  }

  if (!code) {
    return NextResponse.redirect("/benachrichtigungen?error=missing_code");
  }

  try {
    const response = await axios.post(
      "https://slack.com/api/oauth.v2.access",
      null,
      {
        params: {
          code,
          client_id: SLACK_CLIENT_ID,
          client_secret: SLACK_CLIENT_SECRET,
          redirect_uri: SLACK_REDIRECT_URI,
        },
      }
    );

    const data = response.data;

    if (!data.ok) {
      console.error("Slack OAuth error:", data);
      return NextResponse.redirect("/benachrichtigungen?error=oauth_failed");
    }

    const { access_token, team, authed_user } = data;

    // 🔒 TODO: Save access_token, team.id, etc. in Supabase or DB
    console.log("✅ Slack Connected:", {
      team_id: team.id,
      team_name: team.name,
      access_token,
      authed_user,
    });

    return NextResponse.redirect("/benachrichtigungen?slack_connected=1");
  } catch (err) {
    console.error("OAuth Callback Error:", err);
    return NextResponse.redirect("/benachrichtigungen?error=server_error");
  }
}
