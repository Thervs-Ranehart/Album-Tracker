export default async function handler(req, res) {
  const q = String(req.query?.q ?? "")
    .trim()
    .slice(0, 200);

  if (!q) {
    return res.status(400).json({
      error: "Missing search text.",
    });
  }

  try {
    // Build the Deezer API URL without a newline
    const params = new URLSearchParams({
      q,
      limit: "5",
    });

    const url = `https://api.deezer.com/search/album?${params.toString()}`;

    console.log("Searching Deezer:", url);

    const r = await fetch(url);

    if (!r.ok) {
      console.error("Deezer HTTP error:", r.status, r.statusText);

      return res.status(502).json({
        error: "Deezer is unavailable.",
      });
    }

    const data = await r.json();

    if (data.error) {
      console.error("Deezer API error:", data.error);

      return res.status(502).json({
        error: "Deezer returned an error.",
      });
    }

    const albums = (data.data ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      artist: a.artist?.name ?? "",
    }));

    // Albums rarely change, so let the host cache results for a day
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");

    return res.status(200).json({ albums });
  } catch (error) {
    // Show the actual error in the terminal for debugging
    console.error("Deezer handler failed:", error);

    return res.status(500).json({
      error: "Something went wrong.",
    });
  }
}
