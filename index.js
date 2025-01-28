const http = require("http");
const url = require("url");
const fs = require('fs');
const path = require('path');

const PORT = 8888;

const MIMETYPE = {
	"txt": "text/plain",
	"html": "text/html",
	"css": "text/css",
    "js": "application/javascript",
	"json": "application/json",
	"svg": "image/svg+xml",
	"ico": "image/x-icon",
};

const server = http.createServer();

server.on("request", async (req, res) => {

    try {

        let resource = url.parse(req.url).pathname.split("/").pop() || "index.html";
        const resourcePath = path.join("PUBLIC", resource);
        
        /* PUBLIC */
        if (resource.includes(".") && fs.existsSync(resourcePath)) {
            const extn = resourcePath.split(".").pop();
            const mime = MIMETYPE[extn];
            if (mime) {
                res.writeHead(200, { 'Content-Type': mime });
            }
            res.end(fs.readFileSync(resourcePath));
            return;
        }

        /* GRAPHQL  */
        if (resource === "graphql" && req.method.toLowerCase() === "post") {
            const body = await new Promise((resolve, reject) => {
                let data = "";
                req.on("data", (chunk) => data += chunk);
                req.on("end", () => resolve(data));
                req.on("error", () => reject("Problem reading payload"));
            });
            resource = JSON.parse(body).operationName;
        }

        /* REST API */
        const jsonPath = path.join("API", `${resource}.json`);
        if (fs.existsSync(jsonPath)) {
            const rawJsonData = fs.readFileSync(jsonPath, 'utf8');
            const parsedJsonData = JSON.parse(rawJsonData);
            const stringifiedJsonData = JSON.stringify(parsedJsonData);
            
            // res.statusCode = 200;
            // res.setHeader('Content-Type', 'application/json');
            res.writeHead(200, { 'Content-Type': 'application/json' });

            // res.write(stringifiedJsonData);
            res.end(stringifiedJsonData);
            return;
        }

        /* NO FILE FOUND */
        res.statusCode = 404;
        res.end('Mock file not found!');
        return;

    } catch (e) {
        console.error(e)
        res.statusCode = 500;
        res.end('Something went wrong!');
    }

})

server.listen(PORT, "127.0.0.1", () => {
    const addr = server.address();
    console.log(`Mock Server http://localhost:${addr.port}`);
});
