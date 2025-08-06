export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const userId = searchParams.get("id");
  const guildId = searchParams.get("guild");

  if (!userId || !guildId) {
    return new Response(JSON.stringify({ error: "Missing ?id or ?guild parameter" }), {
      headers: { "Content-Type": "application/json" },
      status: 400
    });
  }

  const token = process.env.DISCORD_BOT_TOKEN;

  const FLAGS = {
    1 << 0: "Discord Employee",
    1 << 1: "Partnered Server Owner",
    1 << 2: "HypeSquad Events",
    1 << 3: "Bug Hunter Level 1",
    1 << 6: "HypeSquad Bravery",
    1 << 7: "HypeSquad Brilliance",
    1 << 8: "HypeSquad Balance",
    1 << 9: "Early Supporter",
    1 << 14: "Bug Hunter Level 2",
    1 << 17: "Verified Bot",
    1 << 18: "Early Verified Bot Developer",
    1 << 22: "Active Developer"
  };

  const premiumTypes = {
    0: "Kein Nitro",
    1: "Nitro Classic",
    2: "Nitro",
    3: "Nitro Basic"
  };

  try {
    // Global User Daten
    const userRes = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: { Authorization: `Bot ${token}` }
    });
    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        headers: { "Content-Type": "application/json" },
        status: userRes.status
      });
    }
    const user = await userRes.json();

    // Server Member Daten
    const memberRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
      headers: { Authorization: `Bot ${token}` }
    });
    if (!memberRes.ok) {
      return new Response(JSON.stringify({ error: "Member not found in guild" }), {
        headers: { "Content-Type": "application/json" },
        status: memberRes.status
      });
    }
    const member = await memberRes.json();

    // Avatar
    let avatarURL = user.avatar 
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=1024`
      : `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`;

    // Banner
    let bannerURL = user.banner
      ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.png?size=1024`
      : null;

    // Erstellt am
    const createdTimestamp = Math.floor(user.id / 4194304 + 1420070400000);

    // Badges
    let badgeList = [];
    for (let flag in FLAGS) {
      if (user.public_flags & flag) badgeList.push(FLAGS[flag]);
    }

    // Rollenliste sortieren (ohne @everyone)
    const roles = member.roles.filter(r => r !== guildId);

    // API-Ausgabe
    return new Response(JSON.stringify({
      username_tag: `${user.username}#${user.discriminator}`,
      id: user.id,
      is_bot: !!user.bot,
      badges: badgeList,
      created_at: createdTimestamp,
      avatar_url: avatarURL,
      banner_url: bannerURL,
      accent_color: user.accent_color ? `#${user.accent_color.toString(16)}` : null,
      nitro_status: premiumTypes[user.premium_type] || "Unbekannt",
      guild: {
        id: guildId,
        nickname: member.nick || null,
        joined_at: member.joined_at ? new Date(member.joined_at).getTime() : null,
        premium_since: member.premium_since ? new Date(member.premium_since).getTime() : null,
        roles: roles
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal Server Error", details: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
