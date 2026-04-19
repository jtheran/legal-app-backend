import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { upsertRecordToVector } from "../services/vector.services";
import config from "./config";

const connectionString = config.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });

const basePrisma = new PrismaClient({ adapter });

export const prisma = basePrisma.$extends({
  query: {
    client: {
      async create({ args, query }) {
        const result = await query(args);
        upsertRecordToVector('Client', result).catch((err) => 
          console.error("Error en Sync Vectorial (Client-Create):", err)
        );
        return result;
      },
      async update({ args, query }) {
        const result = await query(args);
        upsertRecordToVector('Client', result).catch((err) => 
          console.error("Error en Sync Vectorial (Client-Update):", err)
        );
        return result;
      }
    },
    case: {
      async create({ args, query }) {
        const result = await query(args);
        upsertRecordToVector('Case', result).catch((err) => 
          console.error("Error en Sync Vectorial (Case-Create):", err)
        );
        return result;
      },
      async update({ args, query }) {
        const result = await query(args);
        upsertRecordToVector('Case', result).catch((err) => 
          console.error("Error en Sync Vectorial (Case-Update):", err)
        );
        return result;
      }
    }
  }
});