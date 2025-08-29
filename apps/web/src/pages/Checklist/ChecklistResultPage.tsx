// // src/pages/Checklist/ChecklistResultPage.tsx
// import { useEffect, useMemo, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import Sidebar from "../../components/Sidebar/Sidebar";
// import Header from "../../components/Header/Header";
// import styles from "./ChecklistPage.module.css";
// import {
//   getUserChecklist,
//   getUserChecklistItems,
//   addUserChecklistItem,
//   patchUserChecklistItem,
//   deleteUserChecklistItem,
// } from "../../api/checklist";

// type Item = {
//   uciId: number;
//   title: string;
//   description?: string;
//   tag: "NONE" | "SAVING" | "EXCHANGE" | "INSURANCE" | "DOCUMENT" | "ETC";
//   status: "TODO" | "DOING" | "DONE" | "SKIP";
// };

// export default function ChecklistResultPage() {
//   const { checklistId } = useParams<{ checklistId: string }>();
//   const navigate = useNavigate();

//   const id = useMemo(() => Number(checklistId), [checklistId]);

//   const [loading, setLoading] = useState(true);
//   const [title, setTitle] = useState("체크리스트");
//   const [items, setItems] = useState<Item[]>([]);
//   const [editMode, setEditMode] = useState(false);

//   const [newTitle, setNewTitle] = useState("");
//   const [newDesc, setNewDesc] = useState("");
//   const [newTag, setNewTag] = useState<Item["tag"]>("NONE");

  useEffect(() => {
    if (!Number.isFinite(id)) {
      navigate("/checklist");
      return;
    }
    (async () => {
      try {
        const [list, listItems] = await Promise.all([
          getUserChecklist(id),
          getUserChecklistItems(id),
        ]);
        setTitle(list?.title ?? "체크리스트");
        setItems(
          (listItems ?? []).map((it: any) => ({
            uciId: it.uciId ?? it.id,
            title: it.title,
            description: it.description,
            tag: it.tag ?? "NONE",
            status: it.status ?? "TODO",
          }))
        );
      } catch (e) {
        console.error(e);
        alert("체크리스트를 불러오지 못했습니다.");
        navigate("/checklist");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);


//   const toggleDone = async (item: Item) => {
//     const next = item.status === "DONE" ? "TODO" : "DONE";
//     try {
//       await patchUserChecklistItem(item.uciId, { status: next });
//       setItems((prev) =>
//         prev.map((it) =>
//           it.uciId === item.uciId ? { ...it, status: next } : it
//         )
//       );
//     } catch (e) {
//       console.error(e);
//       alert("상태 변경 실패");
//     }
//   };

//   const remove = async (uciId: number) => {
//     if (!confirm("삭제할까요?")) return;
//     try {
//       await deleteUserChecklistItem(uciId);
//       setItems((prev) => prev.filter((it) => it.uciId !== uciId));
//     } catch (e) {
//       console.error(e);
//       alert("삭제 실패");
//     }
//   };

//   const add = async () => {
//     if (!newTitle.trim()) return alert("항목명을 입력하세요.");
//     try {
//       const created = await addUserChecklistItem(id, {
//         title: newTitle.trim(),
//         description: newDesc.trim() || undefined,
//         tag: newTag,
//       });
//       const appended: Item = {
//         uciId: created.uciId ?? created.id,
//         title: created.title ?? newTitle.trim(),
//         description: created.description ?? newDesc.trim(),
//         tag: created.tag ?? newTag,
//         status: created.status ?? "TODO",
//       };
//       setItems((prev) => [appended, ...prev]);
//       setNewTitle("");
//       setNewDesc("");
//       setNewTag("NONE");
//     } catch (e) {
//       console.error(e);
//       alert("추가 실패");
//     }
//   };

//   return (
//     <div className={styles.container}>
//       <Sidebar isOpen={false} toggle={() => {}} />
//       <main className={styles.main}>
//         <Header />
//         <div className={styles.pageContent}>
//           <header className={styles.heroWrap}>
//             <h1 className={styles.hero}>{title}</h1>
//           </header>

//           {loading ? (
//             <p style={{ padding: 24 }}>체크리스트를 생성/불러오는 중입니다…</p>
//           ) : (
//             <>
//               <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
//                 {!editMode ? (
//                   <>
//                     <button className="btn" onClick={() => setEditMode(true)}>
//                       수정하기
//                     </button>
//                     <button
//                       className="btn"
//                       onClick={() => navigate("/checklist")}
//                     >
//                       생성완료
//                     </button>
//                   </>
//                 ) : (
//                   <>
//                     <button className="btn" onClick={() => setEditMode(false)}>
//                       저장하기
//                     </button>
//                     <button
//                       className="btn"
//                       onClick={() => navigate("/checklist")}
//                     >
//                       취소하기
//                     </button>
//                   </>
//                 )}
//               </div>

//               {editMode && (
//                 <div
//                   style={{
//                     border: "2px solid #111",
//                     borderRadius: 12,
//                     padding: 12,
//                     marginBottom: 16,
//                   }}
//                 >
//                   <h3 style={{ marginTop: 0 }}>항목 추가</h3>
//                   <div style={{ display: "grid", gap: 8, maxWidth: 560 }}>
//                     <input
//                       placeholder="항목명"
//                       value={newTitle}
//                       onChange={(e) => setNewTitle(e.target.value)}
//                     />
//                     <textarea
//                       placeholder="설명 (선택)"
//                       value={newDesc}
//                       onChange={(e) => setNewDesc(e.target.value)}
//                     />
//                     <select
//                       value={newTag}
//                       onChange={(e) => setNewTag(e.target.value as Item["tag"])}
//                     >
//                       <option value="NONE">기타</option>
//                       <option value="SAVING">Saving</option>
//                       <option value="EXCHANGE">Exchange</option>
//                       <option value="INSURANCE">Insurance</option>
//                       <option value="DOCUMENT">Document</option>
//                       <option value="ETC">Etc</option>
//                     </select>
//                     <button className="btn" onClick={add}>
//                       추가하기
//                     </button>
//                   </div>
//                 </div>
//               )}

//               <div
//                 style={{
//                   border: "2px solid #111",
//                   borderRadius: 12,
//                   overflow: "hidden",
//                 }}
//               >
//                 <table style={{ width: "100%", borderCollapse: "collapse" }}>
//                   <thead>
//                     <tr style={{ background: "#e9f2ff" }}>
//                       <th
//                         style={{ padding: 12, borderBottom: "2px solid #111" }}
//                       >
//                         구분
//                       </th>
//                       <th
//                         style={{ padding: 12, borderBottom: "2px solid #111" }}
//                       >
//                         항목명
//                       </th>
//                       {editMode && (
//                         <th
//                           style={{
//                             padding: 12,
//                             borderBottom: "2px solid #111",
//                           }}
//                         >
//                           액션
//                         </th>
//                       )}
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {items.map((it) => (
//                       <tr key={it.uciId}>
//                         <td
//                           style={{
//                             padding: 12,
//                             borderBottom: "1px solid #ddd",
//                             whiteSpace: "nowrap",
//                           }}
//                         >
//                           {it.tag}
//                         </td>
//                         <td
//                           style={{
//                             padding: 12,
//                             borderBottom: "1px solid #ddd",
//                           }}
//                         >
//                           <div
//                             style={{
//                               display: "flex",
//                               alignItems: "center",
//                               gap: 8,
//                             }}
//                           >
//                             {editMode ? (
//                               <>
//                                 <input
//                                   type="checkbox"
//                                   checked={it.status === "DONE"}
//                                   onChange={() => toggleDone(it)}
//                                 />
//                                 <span>{it.title}</span>
//                               </>
//                             ) : (
//                               <span>{it.title}</span>
//                             )}
//                           </div>
//                         </td>
//                         {editMode && (
//                           <td
//                             style={{
//                               padding: 12,
//                               borderBottom: "1px solid #ddd",
//                             }}
//                           >
//                             <button
//                               className="btn"
//                               onClick={() => remove(it.uciId)}
//                             >
//                               삭제
//                             </button>
//                           </td>
//                         )}
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }
