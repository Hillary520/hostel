import type { ReactNode } from 'react'

import { Modal } from './Modal'

export interface DetailItem {
  label: string
  value: ReactNode
}

export interface DetailSection {
  title?: string
  items: DetailItem[]
}

export function DetailsModal({
  open,
  title,
  onClose,
  sections,
}: {
  open: boolean
  title: string
  onClose: () => void
  sections: DetailSection[]
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="details-grid">
        {sections.map((section, sectionIndex) => (
          <section key={`${section.title ?? 'section'}-${sectionIndex}`} className="details-section">
            {section.title ? <h4>{section.title}</h4> : null}
            <dl className="details-list">
              {section.items.map((item, itemIndex) => (
                <div key={`${item.label}-${itemIndex}`} className="details-row">
                  <dt>{item.label}</dt>
                  <dd>{item.value ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Modal>
  )
}
