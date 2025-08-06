export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const userId = searchParams.get("id");

  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing ?id parameter" }), {
      headers: { "Content-Type": "application/json" },
      status: 400
    });
  }

  // Discord Bot Token (muss Leserechte haben)
  const token = context.env.DISCORD_BOT_TOKEN;


  try {
    const userRes = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: {
        Authorization: `Bot ${token}`
      }
    });

    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        headers: { "Content-Type": "application/json" },
        status: userRes.status
      });
    }

    const user = await userRes.json();

    // Avatar-URL
    let avatarURL = user.avatar 
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=1024`
      : `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`;

    // Banner-URL
    let bannerURL = user.banner
      ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.png?size=1024`
      : null;

    // Discord Snowflake → Timestamp (in ms)
    const createdTimestamp = Math.floor(user.id / 4194304 + 1420070400000);

    // API-Antwort
    return new Response(JSON.stringify({
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      global_name: user.global_name || null,
      mention: `<@${user.id}>`,
      avatar: avatarURL,
      banner: bannerURL,
      banner_color: user.banner_color || null,
      is_bot: !!user.bot,
      public_flags: user.public_flags || 0,
      created_at: createdTimestamp // Unix Timestamp in ms
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
        }
