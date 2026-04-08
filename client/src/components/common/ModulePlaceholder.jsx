import PageHeader from "./PageHeader";

function ModulePlaceholder({ title, description, items }) {
  return (
    <section className="page-grid">
      <PageHeader title={title} subtitle={description} />
      <div className="content-card">
        <h3>Module Scope</h3>
        <ul className="simple-list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default ModulePlaceholder;
