import app from "../server/app.js";

const restoreOriginalApiPath = (requestUrl: string) => {
	try {
		const url = new URL(requestUrl, "http://localhost");
		const pathParts = url.searchParams.getAll("path");
		if (pathParts.length === 0) return null;

		url.searchParams.delete("path");
		const apiPath = `/${pathParts.filter(Boolean).join("/")}`;
		const search = url.searchParams.toString();
		return `/api${apiPath}${search ? `?${search}` : ""}`;
	} catch {
		return null;
	}
};

export default function handler(req: { url?: string }, res: unknown) {
	if (typeof req.url === "string") {
		const restored = restoreOriginalApiPath(req.url);
		if (restored) req.url = restored;
	}

	return app(req as any, res as any);
}
