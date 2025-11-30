// app/api/stats/route.ts
export async function GET() {
  try {
    // Sizning Deno Deploy backendingizga so'rov
    const res = await fetch('https://tm-auto.deno.dev/api/stats', {
      next: { revalidate: 15 }, // 15 soniyada yangilanadi
    });

    if (!res.ok) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
