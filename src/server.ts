import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { Client } from "pg";
import { getEnvVarOrFail } from "./support/envVarUtils";
// import { setupDBClientConfig } from "./support/setupDBClientConfig";

dotenv.config(); //Read .env file lines as though they were env vars.

// const dbClientConfig = setupDBClientConfig();
// const client = new Client(dbClientConfig);

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

//Configure express routes
const app = express();

app.use(express.json()); //add JSON body parser to each following route handler
app.use(cors()); //add CORS support to each following route handler

app.get("/", async (_req, res) => {
    const allSnippets = await client.query(
        "SELECT * FROM code_snippets ORDER BY id DESC LIMIT 10"
    );
    res.json(allSnippets.rows);
});

app.post("/", async (req, res) => {
    const newSnippet = req.body;
    await client.query(
        "INSERT INTO code_snippets (title,code_snippet,date) VALUES ($1, $2, $3)",
        [newSnippet.title, newSnippet.code_snippet, newSnippet.date]
    );
    res.json("successfully inserted");
});

app.get("/health-check", async (_req, res) => {
    try {
        //For this to be successful, must connect to db
        await client.query("select now()");
        res.status(200).send("system ok");
    } catch (error) {
        //Recover from error rather than letting system halt
        console.error(error);
        res.status(500).send("An error occurred. Check server logs.");
    }
});

connectToDBAndStartListening();

async function connectToDBAndStartListening() {
    console.log("Attempting to connect to db");
    await client.connect();
    console.log("Connected to db!");

    const port = getEnvVarOrFail("PORT");
    app.listen(port, () => {
        console.log(
            `Server started listening for HTTP requests on port ${port}.  Let's go!`
        );
    });
}
