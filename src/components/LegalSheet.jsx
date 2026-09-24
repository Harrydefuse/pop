import { useState } from 'react'
import { Btn, Modal, Panel } from './ui'
import Icon from './Icon'
import { DATA_KEPT, DOCS, DOC_ORDER, LEGAL_UPDATED, LEGAL_VERSION, OPERATOR, PERMISSIONS } from '../game/legal'

/**
 * The legal pages, in the app rather than on a website somewhere.
 *
 * An index and four documents, because somebody looking for "what do you do
 * with my data" should not have to guess which of four headings covers it, and
 * somebody who opened Terms should be able to get to Privacy without going
 * back to a menu they have already forgotten.
 */
function DataTable() {
  return (
    <div className="border border-line rounded-[var(--radius-sm)] overflow-hidden">
      {DATA_KEPT.map((d, i) => (
        <div key={d.what} className={`p-3 ${i ? 'border-t border-line' : ''}`}>
          <div className="font-display text-[14px] text-ink">{d.what}</div>
          <div className="text-[14px] text-ink-dim leading-snug mt-1">{d.detail}</div>
          <div className="text-[13px] text-ink-faint leading-snug mt-1.5">{d.why}</div>
        </div>
      ))}
      <div className="p-3 border-t border-line">
        <div className="font-display text-[14px] text-ink">What it asks permission for</div>
        {PERMISSIONS.map((p) => (
          <div key={p.what} className="text-[14px] text-ink-dim leading-snug mt-1.5">
            <span className="text-ink">{p.what}.</span> {p.when} <span className="text-ink-faint">{p.refused}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Doc({ doc, onPick }) {
  return (
    <>
      <p className="text-[15px] text-ink leading-relaxed">{doc.summary}</p>

      {doc.sections.map((s) => (
        <section key={s.h} className="mt-5">
          <h3 className="font-display text-[15px] text-ink mb-2">{s.h}</h3>
          {s.list === 'data' ? (
            <DataTable />
          ) : (
            s.p.map((line, i) => (
              <p key={i} className="text-[14px] text-ink-dim leading-relaxed mb-2 last:mb-0">
                {line}
              </p>
            ))
          )}
        </section>
      ))}

      <div className="mt-6 pt-4 border-t border-line">
        <div className="label text-ink-faint">THE OTHERS</div>
        <div className="flex flex-wrap gap-2 mt-2">
          {DOC_ORDER.filter((k) => k !== doc.id).map((k) => (
            <button
              key={k}
              onClick={() => onPick(k)}
              className="label px-3 min-h-[44px] border border-line rounded-full text-ink-dim active:text-ink"
            >
              {DOCS[k].title}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

export default function LegalSheet({ start = null, onClose }) {
  const [open, setOpen] = useState(start)
  const doc = open ? DOCS[open] : null

  return (
    <Modal open onClose={onClose} title={doc ? doc.title.toUpperCase() : 'LEGAL'}>
      {doc ? (
        <>
          <button
            onClick={() => setOpen(null)}
            className="flex items-center gap-1.5 label text-ink-faint min-h-[44px] active:text-ink"
          >
            <Icon name="chevron" size={10} color="currentColor" className="rotate-180" />
            All documents
          </button>
          <Doc doc={doc} onPick={setOpen} />
        </>
      ) : (
        <>
          <div className="space-y-2">
            {DOC_ORDER.map((k) => (
              <button
                key={k}
                onClick={() => setOpen(k)}
                className="w-full flex items-center gap-3 px-3 py-3 min-h-[56px] border border-line rounded-[var(--radius-sm)] text-left active:bg-panel-2"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[15px] text-ink">{DOCS[k].title}</span>
                  <span className="block text-[13px] text-ink-faint leading-snug mt-0.5">{DOCS[k].summary}</span>
                </span>
                <Icon name="chevron" size={11} color="var(--color-ink-faint)" />
              </button>
            ))}
          </div>

          {/* Said once, at the top level, because it is the fact the other four
              documents are all downstream of. */}
          <Panel className="p-3.5 mt-4">
            <div className="font-display text-[14px] text-ink">Nothing leaves your device</div>
            <p className="text-[14px] text-ink-dim leading-snug mt-1.5">
              No account, no server, no analytics, no cookies and no third-party scripts. Your character and your
              training live in this browser and nowhere else.
            </p>
          </Panel>

          <div className="mt-4 pt-4 border-t border-line">
            <div className="label text-ink-faint">WHO RUNS THIS</div>
            {OPERATOR.filled ? (
              <div className="text-[14px] text-ink-dim leading-relaxed mt-2">
                <div className="text-ink">{OPERATOR.name}</div>
                <div>{OPERATOR.entity}</div>
                <div>{OPERATOR.address}</div>
                {OPERATOR.companyNo && <div>Company no. {OPERATOR.companyNo}</div>}
                <div>{OPERATOR.email}</div>
              </div>
            ) : (
              // Better to admit the gap than to print a plausible-looking
              // address. A trader has to identify itself, and a placeholder
              // that reads like a real one is worse than an obvious blank.
              <p className="text-[14px] text-ink-dim leading-snug mt-2">
                Not filled in yet. LVL100 is an unreleased prototype with no operator details to give. These have to be
                here before it ships to anyone.
              </p>
            )}
            <p className="text-[13px] text-ink-faint leading-snug mt-3">
              Version {LEGAL_VERSION} · {LEGAL_UPDATED}. Written to describe what the app does, and not reviewed by a
              lawyer.
            </p>
          </div>
        </>
      )}

      <Btn full variant="ghost" className="mt-5" onClick={onClose}>
        Close
      </Btn>
    </Modal>
  )
}
