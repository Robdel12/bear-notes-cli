import { DatabaseSync } from 'node:sqlite'
import { DB_PATH, CORE_DATA_EPOCH } from './constants.js'

let db = null

export function getDb() {
  if (!db) {
    try {
      db = new DatabaseSync(DB_PATH, { readOnly: true })
    } catch (err) {
      console.error(`Could not open Bear database at:\n  ${DB_PATH}\n\nIs Bear installed?`)
      process.exit(1)
    }
  }
  return db
}

export function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}

process.on('exit', closeDb)

// Core Data timestamps are seconds since 2001-01-01
export function toDate(ts) {
  if (ts == null) return null
  return new Date((ts + CORE_DATA_EPOCH) * 1000)
}

export function toISO(ts) {
  let d = toDate(ts)
  return d ? d.toISOString() : null
}

// --- Query helpers ---

export function listNotes(opts = {}) {
  let d = getDb()
  let conditions = []
  let params = []
  let joins = []

  if (opts.trashed) {
    conditions.push('n.ZTRASHED = 1')
  } else {
    conditions.push('n.ZTRASHED = 0')
  }

  if (opts.archived != null) {
    conditions.push('n.ZARCHIVED = ?')
    params.push(opts.archived ? 1 : 0)
  } else if (!opts.trashed) {
    conditions.push('n.ZARCHIVED = 0')
  }

  if (opts.pinned) {
    conditions.push('n.ZPINNED = 1')
  }

  if (opts.hasTodo) {
    conditions.push('(n.ZTODOCOMPLETED > 0 OR n.ZTODOINCOMPLETED > 0)')
  }

  if (opts.tag) {
    joins.push('JOIN Z_5TAGS jt ON jt.Z_5NOTES = n.Z_PK')
    joins.push('JOIN ZSFNOTETAG t ON t.Z_PK = jt.Z_13TAGS')
    conditions.push('t.ZTITLE = ?')
    params.push(opts.tag)
  }

  let sortCol = opts.sort === 'created' ? 'n.ZCREATIONDATE'
    : opts.sort === 'title' ? 'n.ZTITLE'
    : 'n.ZMODIFICATIONDATE'
  let sortDir = opts.order === 'asc' ? 'ASC' : 'DESC'
  let limit = opts.limit || 20

  let sql = `
    SELECT DISTINCT n.ZUNIQUEIDENTIFIER, n.ZTITLE, n.ZSUBTITLE,
           n.ZCREATIONDATE, n.ZMODIFICATIONDATE,
           n.ZPINNED, n.ZARCHIVED, n.ZTRASHED,
           n.ZTODOCOMPLETED, n.ZTODOINCOMPLETED,
           n.ZHASFILES, n.ZHASIMAGES
    FROM ZSFNOTE n
    ${joins.join('\n    ')}
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${sortCol} ${sortDir}
    LIMIT ?
  `
  params.push(limit)

  return d.prepare(sql).all(...params)
}

export function getNoteById(uuid) {
  let d = getDb()
  return d.prepare(`
    SELECT * FROM ZSFNOTE WHERE ZUNIQUEIDENTIFIER = ?
  `).get(uuid) || null
}

export function getNoteByTitle(title) {
  let d = getDb()
  // Exact match first
  let note = d.prepare(`
    SELECT * FROM ZSFNOTE WHERE ZTITLE = ? AND ZTRASHED = 0
  `).get(title)
  if (note) return note

  // Case-insensitive fallback
  return d.prepare(`
    SELECT * FROM ZSFNOTE WHERE ZTITLE LIKE ? AND ZTRASHED = 0
  `).get(title) || null
}

export function resolveNote(idOrTitle) {
  // Try UUID first (looks like a UUID)
  if (idOrTitle.includes('-') && idOrTitle.length > 20) {
    let note = getNoteById(idOrTitle)
    if (note) return note
  }
  return getNoteByTitle(idOrTitle)
}

export function getNoteTags(notePk) {
  let d = getDb()
  return d.prepare(`
    SELECT t.ZTITLE, t.ZUNIQUEIDENTIFIER
    FROM ZSFNOTETAG t
    JOIN Z_5TAGS jt ON jt.Z_13TAGS = t.Z_PK
    WHERE jt.Z_5NOTES = ?
    ORDER BY t.ZTITLE
  `).all(notePk)
}

export function searchNotes(query, opts = {}) {
  let d = getDb()
  let limit = opts.limit || 20
  let lowerQuery = query.toLowerCase()
  let likePattern = `%${query}%`

  let conditions = ['ZTEXT LIKE ? AND ZTRASHED = 0']
  // Params ordered to match ? appearance in SQL:
  // 1st ? = INSTR in SELECT, 2nd ? = LIKE in WHERE, then optional tag, then LIMIT
  let whereParams = [likePattern]

  if (opts.tag) {
    conditions.push(`Z_PK IN (
      SELECT jt.Z_5NOTES FROM Z_5TAGS jt
      JOIN ZSFNOTETAG t ON t.Z_PK = jt.Z_13TAGS
      WHERE t.ZTITLE = ?
    )`)
    whereParams.push(opts.tag)
  }

  // Build params in SQL positional order: INSTR(?), WHERE(?...), LIMIT(?)
  let params = [lowerQuery, ...whereParams, limit]

  return d.prepare(`
    SELECT ZUNIQUEIDENTIFIER, ZTITLE, ZSUBTITLE,
           ZCREATIONDATE, ZMODIFICATIONDATE,
           SUBSTR(ZTEXT, MAX(1, INSTR(LOWER(ZTEXT), ?) - 60), 160) as ZSNIPPET
    FROM ZSFNOTE
    WHERE ${conditions.join(' AND ')}
    ORDER BY ZMODIFICATIONDATE DESC
    LIMIT ?
  `).all(...params)
}

export function listTags() {
  let d = getDb()
  return d.prepare(`
    SELECT ZTITLE, ZUNIQUEIDENTIFIER, ZISROOT, ZPINNED
    FROM ZSFNOTETAG
    ORDER BY ZTITLE
  `).all()
}

export function getTagNoteCounts() {
  let d = getDb()
  return d.prepare(`
    SELECT t.ZTITLE, COUNT(jt.Z_5NOTES) as count
    FROM ZSFNOTETAG t
    LEFT JOIN Z_5TAGS jt ON jt.Z_13TAGS = t.Z_PK
    LEFT JOIN ZSFNOTE n ON n.Z_PK = jt.Z_5NOTES AND n.ZTRASHED = 0
    GROUP BY t.Z_PK
    ORDER BY t.ZTITLE
  `).all()
}

export function getBacklinks(notePk) {
  let d = getDb()
  return {
    incoming: d.prepare(`
      SELECT DISTINCT n.ZUNIQUEIDENTIFIER, n.ZTITLE
      FROM ZSFNOTEBACKLINK bl
      JOIN ZSFNOTE n ON n.Z_PK = bl.ZLINKEDBY
      WHERE bl.ZLINKINGTO = ? AND n.ZTRASHED = 0
    `).all(notePk),
    outgoing: d.prepare(`
      SELECT DISTINCT n.ZUNIQUEIDENTIFIER, n.ZTITLE
      FROM ZSFNOTEBACKLINK bl
      JOIN ZSFNOTE n ON n.Z_PK = bl.ZLINKINGTO
      WHERE bl.ZLINKEDBY = ? AND n.ZTRASHED = 0
    `).all(notePk),
  }
}

export function getStats() {
  let d = getDb()
  let notes = d.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN ZTRASHED = 0 AND ZARCHIVED = 0 THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN ZTRASHED = 1 THEN 1 ELSE 0 END) as trashed,
      SUM(CASE WHEN ZARCHIVED = 1 THEN 1 ELSE 0 END) as archived,
      SUM(CASE WHEN ZPINNED = 1 THEN 1 ELSE 0 END) as pinned,
      SUM(CASE WHEN ZENCRYPTED = 1 THEN 1 ELSE 0 END) as encrypted,
      SUM(CASE WHEN ZHASFILES = 1 OR ZHASIMAGES = 1 THEN 1 ELSE 0 END) as withAttachments,
      SUM(ZTODOCOMPLETED) as todosComplete,
      SUM(ZTODOINCOMPLETED) as todosIncomplete
    FROM ZSFNOTE
  `).get()

  let tags = d.prepare('SELECT COUNT(*) as count FROM ZSFNOTETAG').get()
  let files = d.prepare('SELECT COUNT(*) as count FROM ZSFNOTEFILE').get()
  let backlinks = d.prepare('SELECT COUNT(*) as count FROM ZSFNOTEBACKLINK').get()

  return { ...notes, tags: tags.count, files: files.count, backlinks: backlinks.count }
}

export function getNoteFiles(notePk) {
  let d = getDb()
  return d.prepare(`
    SELECT ZUNIQUEIDENTIFIER, ZFILENAME, ZNORMALIZEDFILEEXTENSION,
           ZFILESIZE, ZWIDTH, ZHEIGHT, ZCREATIONDATE
    FROM ZSFNOTEFILE
    WHERE ZNOTE = ?
    ORDER BY ZINDEX
  `).all(notePk)
}
