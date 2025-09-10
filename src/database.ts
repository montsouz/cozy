import Database from "better-sqlite3";
import * as path from "path";
import { app } from "electron";

export class DatabaseService {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    // Store database in user data directory
    const userDataPath = app.getPath("userData");
    this.dbPath = path.join(userDataPath, "cozy.db");
  }

  async initialize(): Promise<void> {
    try {
      this.db = new Database(this.dbPath);
      console.log("Connected to SQLite database at:", this.dbPath);

      this.createTables();
    } catch (err) {
      console.error("Error opening database:", err);
      throw err;
    }
  }

  private createTables(): void {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
      this.db.exec(createTableSQL);
      console.log("Database tables initialized");
    } catch (err) {
      console.error("Error creating table:", err);
      throw err;
    }
  }

  async saveContent(content: string): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    // For simplicity, we'll always insert a new record
    // In a more sophisticated app, you might want to update the latest record
    const insertSQL = `
      INSERT INTO documents (content, updated_at) 
      VALUES (?, CURRENT_TIMESTAMP)
    `;

    try {
      const stmt = this.db.prepare(insertSQL);
      const result = stmt.run(content);
      console.log("Content saved with ID:", result.lastInsertRowid);
    } catch (err) {
      console.error("Error saving content:", err);
      throw err;
    }
  }

  async getLatestContent(): Promise<string | null> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const selectSQL = `
      SELECT content FROM documents 
      ORDER BY updated_at DESC 
      LIMIT 1
    `;

    try {
      const stmt = this.db.prepare(selectSQL);
      const row = stmt.get() as { content: string } | undefined;
      return row ? row.content : null;
    } catch (err) {
      console.error("Error getting latest content:", err);
      throw err;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      try {
        this.db.close();
        console.log("Database connection closed");
      } catch (err) {
        console.error("Error closing database:", err);
      }
    }
  }
}
