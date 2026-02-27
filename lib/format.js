import { toISO } from './db.js'

export function normalizeNote(n) {
  return {
    id: n.ZUNIQUEIDENTIFIER,
    title: n.ZTITLE,
    subtitle: n.ZSUBTITLE || null,
    created: toISO(n.ZCREATIONDATE),
    modified: toISO(n.ZMODIFICATIONDATE),
    pinned: !!n.ZPINNED,
    archived: !!n.ZARCHIVED,
    trashed: !!n.ZTRASHED,
    hasFiles: !!n.ZHASFILES,
    hasImages: !!n.ZHASIMAGES,
    todosComplete: n.ZTODOCOMPLETED || 0,
    todosIncomplete: n.ZTODOINCOMPLETED || 0,
    ...(n.ZTEXT != null ? { text: n.ZTEXT } : {}),
    ...(n.ZSNIPPET != null ? { snippet: n.ZSNIPPET.replace(/\n/g, ' ').trim() } : {}),
    ...(n.tags ? { tags: n.tags } : {}),
  }
}

export function normalizeTag(t) {
  return {
    title: t.ZTITLE,
    id: t.ZUNIQUEIDENTIFIER,
    root: !!t.ZISROOT,
    pinned: !!t.ZPINNED,
    ...(t.count != null ? { noteCount: t.count } : {}),
  }
}

export function formatNoteRow(n) {
  let flags = []
  if (n.ZPINNED) flags.push('pinned')
  if (n.ZARCHIVED) flags.push('archived')
  if (n.ZTODOCOMPLETED || n.ZTODOINCOMPLETED) {
    flags.push(`todo:${n.ZTODOCOMPLETED || 0}/${(n.ZTODOCOMPLETED || 0) + (n.ZTODOINCOMPLETED || 0)}`)
  }
  if (n.ZHASIMAGES) flags.push('images')
  if (n.ZHASFILES) flags.push('files')

  let title = n.ZTITLE || '(untitled)'
  let id = n.ZUNIQUEIDENTIFIER
  let modified = toISO(n.ZMODIFICATIONDATE)?.slice(0, 10) || ''
  let flagStr = flags.length ? `  [${flags.join(', ')}]` : ''

  return `${title}\n  ${id}  ${modified}${flagStr}`
}

export function formatNoteDetail(n, opts = {}) {
  let lines = [
    n.ZTITLE || '(untitled)',
    `${'─'.repeat(40)}`,
    `ID:       ${n.ZUNIQUEIDENTIFIER}`,
    `Created:  ${toISO(n.ZCREATIONDATE)}`,
    `Modified: ${toISO(n.ZMODIFICATIONDATE)}`,
  ]

  if (n.ZPINNED) lines.push('Pinned:   yes')
  if (n.ZARCHIVED) lines.push('Archived: yes')
  if (n.ZTRASHED) lines.push('Trashed:  yes')
  if (n.ZTODOCOMPLETED || n.ZTODOINCOMPLETED) {
    lines.push(`Todos:    ${n.ZTODOCOMPLETED || 0}/${(n.ZTODOCOMPLETED || 0) + (n.ZTODOINCOMPLETED || 0)} done`)
  }
  if (n.ZHASIMAGES) lines.push('Images:   yes')
  if (n.ZHASFILES) lines.push('Files:    yes')
  if (n.ZLASTEDITINGDEVICE) lines.push(`Device:   ${n.ZLASTEDITINGDEVICE}`)

  if (opts.tags) {
    lines.push(`Tags:     ${opts.tags.map(t => t.ZTITLE).join(', ') || 'none'}`)
  }

  if (opts.content && n.ZTEXT) {
    lines.push('', n.ZTEXT)
  }

  return lines.join('\n')
}

export function output(data, json) {
  if (json) {
    console.log(JSON.stringify(data, null, 2))
  } else if (typeof data === 'string') {
    console.log(data)
  } else {
    console.log(data)
  }
}
