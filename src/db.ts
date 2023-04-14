import { promises } from "fs";

const { readFile, writeFile } = promises;

type DB = {
	posts: {
		id: string;
		title: string;
		content: string;
		whenCreated: string;
	}[];
	followers: string[];
};

export async function readDB(): Promise<DB> {
	return JSON.parse(await readFile("db.json", "utf8"));
}

export async function writeDB(db: DB): Promise<void> {
	await writeFile("db.json", JSON.stringify(db, null, 2));
}

export async function addFollower(actorIRI: string): Promise<void> {
	const db = await readDB();
	db.followers.push(actorIRI);
	await writeDB(db);
}
