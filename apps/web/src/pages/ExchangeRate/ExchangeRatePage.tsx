import { useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import styles from "./ExchangeRatePage.module.css";
export default function ExchangeRatePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className={styles.container}>
      <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar}></Sidebar>

      <main className={styles.main}>
        <header
          className={`${styles.header} ${
            isSidebarOpen ? styles.withSidebar : styles.noSidebar
          }`}
        >
          <img src="/logo.svg" alt="logo" width={120} height={80} />

        </header>


      </main>
    </div>
  );
}
