import { FaHospitalUser } from "react-icons/fa6";

function PageHeader({ title, subtitle }) {
  return (
    <section className="page-header">
      <h2 className="page-header-title">
        <FaHospitalUser />
        <span>{title}</span>
      </h2>
      {subtitle ? <p>{subtitle}</p> : null}
    </section>
  );
}

export default PageHeader;
