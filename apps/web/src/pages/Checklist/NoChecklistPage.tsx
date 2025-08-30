import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import NoChecklist from "../../components/NoChecklist/NoChecklist";
import styles from "./ChecklistPage.module.css";

export default function NoChecklistPage() {
  const navigate = useNavigate();

  const handleCreateChecklist = () => {
    navigate("/checklist/new");
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <Header />
        <div className={styles.pageContent}>
          <NoChecklist onCreate={handleCreateChecklist} />
        </div>
      </main>
    </div>
  );
}
