const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");

const PORT = 8888;

const MIMETYPE = {
    "txt": "text/plain",
    "html": "text/html",
    "css": "text/css",
    "js": "application/javascript",
    "json": "application/json",
    "pdf": "application/pdf",
    "svg": "image/svg+xml",
    "ico": "image/x-icon",
    "jpg": "image/jpeg",
    "png": "image/png",
    "gif": "image/gif",
};

const server = http.createServer();

server.on("request", async (req, res) => {

    try {

        const pathName = url.parse(req.url).pathname;
        let resource = (pathName === "/") ? "index.html" : pathName.match(/.*\/(\w+)/)[1];
        const resourcePath = path.join("PUBLIC", resource);

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "*");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Custom-Header, Authorization");
        res.setHeader("Access-Control-Allow-Credentials", "true");

        /* PREFLIGHT */
        if (req.method.toUpperCase() === "OPTIONS") {
            res.statusCode = 204
            res.end();
            return;
        }
  
        /* PUBLIC */
        if (resource.includes(".") && fs.existsSync(resourcePath)) {
            const extn = resourcePath.split(".").pop();
            const mime = MIMETYPE[extn];
            if (mime) {
                res.writeHead(200, { "Content-Type": mime });
            }
            res.end(fs.readFileSync(resourcePath));
            return;
        }

        /* GRAPHQL  */
        if (resource === "graphql" && req.method.toUpperCase() === "POST") {
            const body = await new Promise((resolve, reject) => {
                let data = "";
                req.on("data", (chunk) => data += chunk);
                req.on("end", () => resolve(data));
                req.on("error", () => reject("Problem reading payload"));
            });
            resource = JSON.parse(body || null)?.operationName;
        }

        /* REST API */
        const jsonPath = path.join("API", `${resource}.json`);
        if (fs.existsSync(jsonPath)) {
            const rawJsonData = fs.readFileSync(jsonPath, "utf8");
            const parsedJsonData = JSON.parse(rawJsonData);
            const stringifiedJsonData = JSON.stringify(parsedJsonData);

            /* 
                use this multiple times for setting multiple header values
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
            */
            res.writeHead(200, { "Content-Type": "application/json" });

            /* 
                use this for streams, like for sending files.
                res.write(stringifiedJsonData);
            */
            res.end(stringifiedJsonData);
            return;
        }

        /* NO FILE FOUND */
        res.statusCode = 404;
        res.end("Mock file not found!");
        return;

    } catch (e) {
        console.error(e)
        res.statusCode = 500;
        res.end("Something went wrong!");
    }

})

server.listen(PORT, "127.0.0.1", () => {
    const addr = server.address();
    console.log(`Mock Server http://localhost:${addr.port}`);
});
