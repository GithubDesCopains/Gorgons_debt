import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8001;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
};

const server = http.createServer((req, res) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    // API Route for saving levels
    if (req.method === 'POST' && req.url === '/save-levels') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (data.code) {
                    const levelsPath = path.join(__dirname, 'src', 'Levels.js');
                    fs.writeFileSync(levelsPath, data.code, 'utf8');
                    console.log(`[SAVE] Levels.js updated successfully.`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                } else {
                    res.writeHead(400); res.end('Missing code');
                }
            } catch (e) {
                console.error(`[ERROR] Save failed: ${e.message}`);
                res.writeHead(500); res.end(e.message);
            }
        });
        return;
    }

    // Static files serving
    let urlPath = req.url.split('?')[0];
    let filePath = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);
    
    // Safety check for directory traversal
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404); res.end('File not found');
            } else {
                res.writeHead(500); res.end(`Server Error: ${error.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`\x1b[36m%s\x1b[0m`, `Gorgon's Debt Dev Server`);
    console.log(`--------------------------`);
    console.log(`Game:   http://localhost:${PORT}/`);
    console.log(`Editor: http://localhost:${PORT}/editor.html`);
    console.log(`--------------------------`);
    console.log(`Press Ctrl+C to stop the server.`);
});
