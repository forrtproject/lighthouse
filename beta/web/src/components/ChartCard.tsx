import { useId, useState, type ReactNode } from 'react';
import { ChartBar, Table } from '@phosphor-icons/react';

export interface TableData {
  caption: string;
  columns: string[];
  rows: (string | number)[][];
}

interface Props {
  title: string;
  /** One-sentence takeaway, shown under the title and read before the chart. */
  summary: ReactNode;
  source?: string;
  table?: TableData;
  /** Extra controls in the header, e.g. a legend. */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * A chart with its text summary, sources and a data-table view: the accessible
 * alternative the chart rules require. The view switch is one quiet button so
 * it does not compete with the chart.
 */
export function ChartCard({ title, summary, source, table, aside, className, children }: Props) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const headingId = useId();
  const showTable = view === 'table' && table;
  return (
    <section className={`card chart-card ${className ?? ''}`} aria-labelledby={headingId}>
      <header className="card-head">
        <div className="card-titles">
          <h3 id={headingId} className="card-h">{title}</h3>
          <p className="card-summary">{summary}</p>
        </div>
        <div className="card-tools">
          {aside}
          {table && (
            <button type="button" className="ghost-btn" aria-pressed={view === 'table'}
              onClick={() => setView(v => (v === 'chart' ? 'table' : 'chart'))}>
              {view === 'chart' ? <Table size={16} aria-hidden="true" /> : <ChartBar size={16} aria-hidden="true" />}
              {view === 'chart' ? 'Data' : 'Chart'}
              <span className="visually-hidden"> view of {title}</span>
            </button>
          )}
        </div>
      </header>
      <div className="card-body">
        {showTable ? (
          <div className="table-wrap">
            <table className="data-table">
              <caption className="visually-hidden">{table.caption}</caption>
              <thead><tr>{table.columns.map(c => <th key={c} scope="col">{c}</th>)}</tr></thead>
              <tbody>
                {table.rows.map((r, i) => (
                  <tr key={i}>{r.map((v, j) => j === 0 ? <th key={j} scope="row">{v}</th> : <td key={j}>{v}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : children}
      </div>
      {source && <footer className="card-source"><span className="src-label">Source</span>{source}</footer>}
    </section>
  );
}
