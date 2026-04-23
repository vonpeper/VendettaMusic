import { createClient } from "@libsql/client"

/**
 * 🛠️ AGENTE ANTIGRAVITY - CONECTOR DE RESCATE (V12)
 * OBJETIVO: SOPORTE PARA FILTROS 'IN' (Fix: Gira Artística / UpcomingGigs)
 * 
 * Este parche añade soporte para el operador 'in' de Prisma en SQLite,
 * permitiendo filtrar eventos por múltiples estados simultáneamente.
 */
const ABSOLUTE_DB_PATH = "/Users/vonpeper/Documents/Antigravity/Vendetta/prisma/dev.db";

const libsql = createClient({
  url: `file:${ABSOLUTE_DB_PATH}`,
})

const DATE_FIELDS = [
  "date", "createdAt", "updatedAt", "eventDate", "emailVerified", 
  "signedAt", "datetime", "lastCalendarSync", "requestedDate", "tourDate"
];

const transformDateFields = (data: any): any => {
  if (!data) return data;
  if (Array.isArray(data)) return data.map(transformDateFields);
  if (typeof data !== 'object' || data instanceof Date) return data;

  const result = { ...data };
  for (const key of Object.keys(result)) {
    if (DATE_FIELDS.includes(key) && result[key]) {
      const value = result[key];
      if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) result[key] = date;
      }
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = transformDateFields(result[key]);
    }
  }
  return result;
}

const RELATIONS: Record<string, Record<string, { table: string, localField: string, remoteField: string, type: 'one' | 'many' }>> = {
  "User": {
    "clientProfile": { table: "ClientProfile", localField: "id", remoteField: "userId", type: "one" },
    "musicianProfile": { table: "MusicianProfile", localField: "id", remoteField: "userId", type: "one" }
  },
  "Event": {
    "client": { table: "ClientProfile", localField: "clientId", remoteField: "id", type: "one" },
    "location": { table: "Location", localField: "locationId", remoteField: "id", type: "one" },
    "package": { table: "Package", localField: "packageId", remoteField: "id", type: "one" },
    "quote": { table: "Quote", localField: "quoteId", remoteField: "id", type: "one" },
    "contracts": { table: "Contract", localField: "id", remoteField: "eventId", type: "many" }
  },
  "ClientProfile": {
    "user": { table: "User", localField: "userId", remoteField: "id", type: "one" },
    "events": { table: "Event", localField: "id", remoteField: "clientId", type: "many" },
    "quotes": { table: "Quote", localField: "id", remoteField: "clientId", type: "many" },
    "bookings": { table: "BookingRequest", localField: "id", remoteField: "clientId", type: "many" }
  },
  "BookingRequest": {
    "client": { table: "ClientProfile", localField: "clientId", remoteField: "id", type: "one" }
  },
  "Quote": {
    "client": { table: "ClientProfile", localField: "clientId", remoteField: "id", type: "one" },
    "items": { table: "QuoteItem", localField: "id", remoteField: "quoteId", type: "many" }
  },
  "Package": {
    "services": { table: "PackageService", localField: "id", remoteField: "packageId", type: "many" }
  },
  "MusicianProfile": {
    "user": { table: "User", localField: "userId", remoteField: "id", type: "one" },
    "substitutes": { table: "Substitute", localField: "id", remoteField: "musicianProfileId", type: "many" },
    "eventMusicians": { table: "EventMusician", localField: "id", remoteField: "musicianProfileId", type: "many" }
  },
  "Rehearsal": {
    "location": { table: "Location", localField: "locationId", remoteField: "id", type: "one" },
    "musicians": { table: "RehearsalMusician", localField: "id", remoteField: "rehearsalId", type: "many" },
    "songs": { table: "RehearsalSong", localField: "id", remoteField: "rehearsalId", type: "many" }
  },
  "RehearsalMusician": {
    "musician": { table: "MusicianProfile", localField: "musicianId", remoteField: "id", type: "one" },
    "rehearsal": { table: "Rehearsal", localField: "rehearsalId", remoteField: "id", type: "one" }
  },
  "RehearsalSong": {
    "song": { table: "Song", localField: "songId", remoteField: "id", type: "one" },
    "rehearsal": { table: "Rehearsal", localField: "rehearsalId", remoteField: "id", type: "one" }
  },
  "Substitute": {
    "musician": { table: "MusicianProfile", localField: "musicianProfileId", remoteField: "id", type: "one" }
  }
}

const resolveIncludes = async (tableName: string, row: any, include: any): Promise<any> => {
  if (!row || !include) return row;
  const result = { ...row };
  for (const key of Object.keys(include)) {
    const rel = RELATIONS[tableName]?.[key];
    if (rel) {
      if (rel.type === 'one' && result[rel.localField]) {
        const resp = await libsql.execute({
          sql: `SELECT * FROM ${rel.table} WHERE ${rel.remoteField} = ? LIMIT 1`,
          args: [result[rel.localField]]
        });
        if (resp.rows[0]) {
          let nested = { ...resp.rows[0] };
          if (typeof include[key] === 'object' && include[key].include) {
             nested = await resolveIncludes(rel.table, nested, include[key].include);
          }
          result[key] = nested;
        } else {
          result[key] = null;
        }
      } else if (rel.type === 'many') {
        const resp = await libsql.execute({
          sql: `SELECT * FROM ${rel.table} WHERE ${rel.remoteField} = ?`,
          args: [result[rel.localField]]
        });
        let rows = resp.rows.map(r => ({ ...r }));
        if (typeof include[key] === 'object' && include[key].include) {
          rows = await Promise.all(rows.map(r => resolveIncludes(rel.table, r, include[key].include)));
        }
        result[key] = transformDateFields(rows);
      }
    }
  }
  return result;
}

const resolveCount = async (tableName: string, row: any, countArgs: any): Promise<any> => {
  if (!row || !countArgs || !countArgs.select) return {};
  const counts: any = {};
  for (const key of Object.keys(countArgs.select)) {
    const rel = RELATIONS[tableName]?.[key];
    if (rel && rel.type === 'many') {
      const res = await libsql.execute({
        sql: `SELECT COUNT(*) as c FROM ${rel.table} WHERE ${rel.remoteField} = ?`,
        args: [row[rel.localField]]
      });
      counts[key] = Number(res.rows[0].c);
    }
  }
  return counts;
}

const buildWhereClause = (where: any): { sql: string, args: any[] } => {
  if (!where || Object.keys(where).length === 0) return { sql: "", args: [] };
  const clauses: string[] = [];
  const args: any[] = [];

  const processObject = (obj: any, prefix = "") => {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      // Manejar OR, AND, NOT (Recursividad)
      if (key === "OR" || key === "AND") {
        if (Array.isArray(val)) {
          const subClauses: string[] = [];
          for (const subObj of val) {
            const sub = buildWhereClause(subObj);
            if (sub.sql) {
              subClauses.push(`(${sub.sql.replace("WHERE ", "")})`);
              args.push(...sub.args);
            }
          }
          if (subClauses.length > 0) {
            clauses.push(`(${subClauses.join(` ${key} `)})`);
          }
        }
        continue;
      }
      
      if (key === "NOT") {
        const sub = buildWhereClause(val);
        if (sub.sql) {
          clauses.push(`NOT (${sub.sql.replace("WHERE ", "")})`);
          args.push(...sub.args);
        }
        continue;
      }

      if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        if (val.not !== undefined) {
           clauses.push(`"${fullKey}" != ?`);
           args.push(val.not);
        } else if (val.gte !== undefined) {
           clauses.push(`"${fullKey}" >= ?`);
           args.push(val.gte instanceof Date ? val.gte.toISOString() : val.gte);
        } else if (val.gt !== undefined) {
           clauses.push(`"${fullKey}" > ?`);
           args.push(val.gt instanceof Date ? val.gt.toISOString() : val.gt);
        } else if (val.lte !== undefined) {
           clauses.push(`"${fullKey}" <= ?`);
           args.push(val.lte instanceof Date ? val.lte.toISOString() : val.lte);
        } else if (val.lt !== undefined) {
           clauses.push(`"${fullKey}" < ?`);
           args.push(val.lt instanceof Date ? val.lt.toISOString() : val.lt);
        } else if (val.in !== undefined && Array.isArray(val.in)) {
           if (val.in.length > 0) {
             clauses.push(`"${fullKey}" IN (${val.in.map(() => "?").join(", ")})`);
             args.push(...val.in);
           } else {
             clauses.push("1 = 0");
           }
        } else if (val.notIn !== undefined && Array.isArray(val.notIn)) {
           if (val.notIn.length > 0) {
             clauses.push(`"${fullKey}" NOT IN (${val.notIn.map(() => "?").join(", ")})`);
             args.push(...val.notIn);
           }
        } else if (val.contains !== undefined) {
           clauses.push(`"${fullKey}" LIKE ?`);
           args.push(`%${val.contains}%`);
        } else {
           processObject(val, fullKey);
        }
      } else {
        clauses.push(`"${fullKey}" = ?`);
        args.push(val instanceof Date ? val.toISOString() : val);
      }
    }
  }
  
  processObject(where);
  return { sql: clauses.length > 0 ? "WHERE " + clauses.join(" AND ") : "", args };
}

const createModel = (tableName: string) => ({
  count: async (args: any) => {
    try {
      const { sql: whereSql, args: whereArgs } = buildWhereClause(args?.where);
      const res = await libsql.execute({ sql: `SELECT COUNT(*) as c FROM "${tableName}" ${whereSql}`, args: whereArgs });
      return Number(res.rows[0].c)
    } catch (e) { return 0 }
  },
  findMany: async (args: any) => {
    try {
      const limit = args?.take || 5000;
      const { sql: whereSql, args: whereArgs } = buildWhereClause(args?.where);
      let orderPart = "";
      let inMemorySort: any = null;

      if (args?.orderBy) {
         const orderObj = Array.isArray(args.orderBy) ? args.orderBy[0] : args.orderBy;
         const orderKey = Object.keys(orderObj)[0];
         if (typeof orderObj[orderKey] === 'object') {
            // Check if it's a relation to apply in-memory sort later
            if (RELATIONS[tableName]?.[orderKey]) {
               inMemorySort = { relation: orderKey, field: Object.keys(orderObj[orderKey])[0], direction: Object.values(orderObj[orderKey])[0] };
            } else {
               orderPart = `ORDER BY "${orderKey}" ${Object.values(orderObj[orderKey])[0]}`;
            }
         } else {
            orderPart = `ORDER BY "${orderKey}" ${orderObj[orderKey].toUpperCase()}`;
         }
      }
      
      const res = await libsql.execute({
        sql: `SELECT * FROM "${tableName}" ${whereSql} ${orderPart} LIMIT ${limit}`,
        args: whereArgs
      });
      let rows = res.rows.map(r => ({ ...r }));
      if (args?.include) {
        rows = await Promise.all(rows.map(async row => {
           let r = await resolveIncludes(tableName, row, args.include);
           if (args.include._count) {
              r._count = await resolveCount(tableName, r, args.include._count);
           }
           return r;
        }));
      }

      const rows_final = transformDateFields(rows);

      if (inMemorySort) {
        rows_final.sort((a: any, b: any) => {
           const valA = a[inMemorySort.relation]?.[inMemorySort.field] || "";
           const valB = b[inMemorySort.relation]?.[inMemorySort.field] || "";
           if (inMemorySort.direction.toLowerCase() === 'asc') return valA > valB ? 1 : -1;
           return valA < valB ? 1 : -1;
        });
      }

      return rows_final;
    } catch (e: any) { 
       console.error(`❌ [DB findMany Error ${tableName}]: ${e.message}`);
       return [];
    }
  },
  findUnique: async (args: any) => {
    try {
      const { sql: whereSql, args: whereArgs } = buildWhereClause(args.where);
      const res = await libsql.execute({
        sql: `SELECT * FROM "${tableName}" ${whereSql} LIMIT 1`,
        args: whereArgs
      });
      if (!res.rows[0]) return null;
      let row = { ...res.rows[0] };
      if (args?.include) {
        row = await resolveIncludes(tableName, row, args.include);
      }
      return transformDateFields(row);
    } catch (e) { return null }
  },
  findFirst: async (args: any) => {
    try {
      const { sql: whereSql, args: whereArgs } = buildWhereClause(args.where);
      const res = await libsql.execute({
        sql: `SELECT * FROM "${tableName}" ${whereSql} LIMIT 1`,
        args: whereArgs
      });
      if (!res.rows[0]) return null;
      let row = { ...res.rows[0] };
      if (args?.include) {
        row = await resolveIncludes(tableName, row, args.include);
      }
      return transformDateFields(row);
    } catch (e) { return null }
  },
  create: async (args: any) => {
    try {
      const data = { ...args.data };
      const now = new Date().toISOString();
      if (!data.id) data.id = crypto.randomUUID();
      if (!data.createdAt) data.createdAt = now;
      if (!data.updatedAt) data.updatedAt = now;

      // SOPORTE PARA CONNECT / DISCONNECT (Relaciones 'one')
      for (const key of Object.keys(data)) {
        const val = data[key];
        if (val && typeof val === 'object' && !(val instanceof Date)) {
          const rel = RELATIONS[tableName]?.[key];
          if (rel && rel.type === "one") {
            if (val.connect && val.connect.id) {
              data[rel.localField] = val.connect.id;
            } else if (val.disconnect === true) {
              data[rel.localField] = null;
            }
          }
        }
      }
      
      const keys = Object.keys(data).filter(k => typeof data[k] !== 'object' || data[k] instanceof Date);
      const values = keys.map(k => data[k] instanceof Date ? data[k].toISOString() : data[k]);
      const quotedKeys = keys.map(k => `"${k}"`);
      const sql = `INSERT INTO "${tableName}" (${quotedKeys.join(", ")}) VALUES (${keys.map(() => "?").join(", ")}) RETURNING *`;
      const res = await libsql.execute({ sql, args: values });
      let record = res.rows[0];

      if (!record) {
        console.warn(`⚠️ [DB Create Warning ${tableName}]: RETURNING * no devolvió datos. Usando objeto local como respaldo.`);
        record = data;
      }

      // SOPORTE PARA NESTED CREATE
      for (const key of Object.keys(data)) {
        if (data[key] && typeof data[key] === 'object' && data[key].create) {
          const rel = RELATIONS[tableName]?.[key];
          if (rel) {
            const nestedData = { ...data[key].create };
            if (rel.type === 'one') {
              nestedData[rel.remoteField] = record[rel.localField]; 
              await createModel(rel.table).create({ data: nestedData });
            } else if (rel.type === 'many' && Array.isArray(nestedData)) {
              for (const item of nestedData) {
                item[rel.remoteField] = record[rel.localField];
                await createModel(rel.table).create({ data: item });
              }
            } else if (rel.type === 'many') {
               nestedData[rel.remoteField] = record[rel.localField];
               await createModel(rel.table).create({ data: nestedData });
            }
          }
        }
      }

      return transformDateFields({ ...record });
    } catch (e: any) {
      console.error(`❌ [DB Create Error ${tableName}]: ${e.message}`);
      throw e;
    }
  },
  update: async (args: any) => {
    try {
      const data = { ...args.data };
      data.updatedAt = new Date().toISOString();
      const { sql: whereSql, args: whereArgs } = buildWhereClause(args.where);

      // SOPORTE PARA CONNECT / DISCONNECT (Relaciones 'one')
      for (const key of Object.keys(data)) {
        const val = data[key];
        if (val && typeof val === 'object' && !(val instanceof Date)) {
          const rel = RELATIONS[tableName]?.[key];
          if (rel && rel.type === "one") {
            if (val.connect && val.connect.id) {
              data[rel.localField] = val.connect.id;
            } else if (val.disconnect === true) {
              data[rel.localField] = null;
            }
          }
        }
      }

      const updateKeys = Object.keys(data).filter(k => typeof data[k] !== 'object' || data[k] instanceof Date);
      const setSql = updateKeys.map(k => `"${k}" = ?`).join(", ");
      const setArgs = updateKeys.map(k => data[k] instanceof Date ? data[k].toISOString() : data[k]);
      
      const sql = `UPDATE "${tableName}" SET ${setSql} ${whereSql} RETURNING *`;
      const res = await libsql.execute({ sql, args: [...setArgs, ...whereArgs] });
      
      if (!res.rows[0]) {
        return null;
      }
      return transformDateFields({ ...res.rows[0] });
    } catch (e: any) {
      console.error(`❌ [DB Update Error ${tableName}]: ${e.message}`);
      throw e;
    }
  },
  upsert: async (args: any) => {
     try {
        const existing = await createModel(tableName).findUnique({ where: args.where });
        if (existing) {
           return await createModel(tableName).update({ where: args.where, data: args.update });
        } else {
           return await createModel(tableName).create({ data: args.create });
        }
     } catch (e) { throw e; }
  },
  delete: async (args: any) => {
    try {
      const { sql: whereSql, args: whereArgs } = buildWhereClause(args.where);
      const res = await libsql.execute({ sql: `DELETE FROM "${tableName}" ${whereSql} RETURNING *`, args: whereArgs });
      if (!res.rows[0]) return null;
      return transformDateFields({ ...res.rows[0] });
    } catch (e) { throw e; }
  },
  deleteMany: async (args: any) => {
    try {
      const { sql: whereSql, args: whereArgs } = buildWhereClause(args.where);
      const res = await libsql.execute({ sql: `DELETE FROM "${tableName}" ${whereSql}`, args: whereArgs });
      return { count: Number(res.rowsAffected) };
    } catch (e) { return { count: 0 } }
  },
  updateMany: async (args: any) => {
    try {
      const { sql: whereSql, args: whereArgs } = buildWhereClause(args.where);
      const updateKeys = Object.keys(args.data);
      const setSql = updateKeys.map(k => `"${k}" = ?`).join(", ");
      const setArgs = updateKeys.map(k => args.data[k]);
      
      const res = await libsql.execute({
        sql: `UPDATE "${tableName}" SET ${setSql} ${whereSql}`,
        args: [...setArgs, ...whereArgs]
      });
      return { count: res.rowsAffected };
    } catch (e) { return { count: 0 } }
  },
  aggregate: async (args: any) => {
    try {
       const { sql: whereSql, args: whereArgs } = buildWhereClause(args.where);
       const result: any = { _sum: {} };
       if (args._sum) {
          for (const key of Object.keys(args._sum)) {
             const res = await libsql.execute({ sql: `SELECT SUM(${key}) as s FROM ${tableName} ${whereSql}`, args: whereArgs });
             result._sum[key] = Number(res.rows[0].s) || 0;
          }
       }
       return result;
    } catch (e) { return { _sum: {} } }
  },
})

export const db = {
  user: createModel("User"),
  clientProfile: createModel("ClientProfile"),
  musicianProfile: createModel("MusicianProfile"),
  location: createModel("Location"),
  provider: createModel("Provider"),
  package: createModel("Package"),
  packageService: createModel("PackageService"),
  song: createModel("Song"),
  bandEvent: createModel("BandEvent"),
  quote: createModel("Quote"),
  quoteItem: createModel("QuoteItem"),
  event: createModel("Event"),
  payment: createModel("Payment"),
  contract: createModel("Contract"),
  bookingRequest: createModel("BookingRequest"),
  notification: createModel("Notification"),
  globalConfig: createModel("GlobalConfig"),
  siteMedia: createModel("SiteMedia"),
  review: createModel("Review"),
  publicBandMember: createModel("PublicBandMember"),
  rehearsal: createModel("Rehearsal"),
  rehearsalMusician: createModel("RehearsalMusician"),
  rehearsalSong: createModel("RehearsalSong"),
  substitute: createModel("Substitute"),
  
  $queryRawUnsafe: async (query: string, ...args: any[]) => {
    try {
       const res = await libsql.execute({ sql: query, args: args || [] });
       return transformDateFields(res.rows.map(r => ({ ...r })));
    } catch (e: any) { return []; }
  },
  $executeRawUnsafe: async (query: string, ...args: any[]) => {
    try {
       const res = await libsql.execute({ sql: query, args: args || [] });
       return res.rowsAffected;
    } catch (e: any) { return 0; }
  },
  $connect: async () => {},
  $disconnect: async () => {},
  $transaction: async (cb: any) => await cb(db),
} as any
