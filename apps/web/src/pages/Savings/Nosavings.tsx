// src/pages/Savings/Nosavings.tsx
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import styles from "./Nosavings.module.css";
import bg from "../../assets/noChecklist.svg"; // 필요시 전용 이미지로 교체 가능
import { getDeparturesByUserId } from "../../api/departure";
import { getUserChecklistByDepartureId } from "../../api/checklist";
import Swal from "sweetalert2";

type Props = {
  onCreate?: () => void;
  className?: string;
};

export default function NoSavings({ onCreate, className }: Props) {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);

  const checkUserChecklist = async () => {
    try {
      setIsChecking(true);
      
      // 사용자 ID 가져오기
      const storedUserId = localStorage.getItem("userId");
      const userId = storedUserId ? Number(storedUserId) : null;
      
      if (!userId || Number.isNaN(userId)) {
        await Swal.fire({
          icon: "error",
          title: "로그인 필요",
          text: "적금 플랜을 만들기 위해서는 로그인이 필요합니다.",
          confirmButtonText: "확인",
        });
        return;
      }
      
      // 사용자의 출국 정보 확인
      const departures = await getDeparturesByUserId(userId);
      if (!departures || departures.length === 0) {
        await Swal.fire({
          icon: "warning",
          title: "체크리스트를 먼저 생성하세요!",
          text: "적금 플랜을 만들기 전에 먼저 체크리스트를 생성해주세요.",
          confirmButtonText: "체크리스트 만들기",
          showCancelButton: true,
          cancelButtonText: "취소",
        }).then((result) => {
          if (result.isConfirmed) {
            navigate("/checklist/new");
          }
        });
        return;
      }
      
      // 체크리스트 존재 여부 확인
      const departureId = departures[0].departureId;
      const userChecklist = await getUserChecklistByDepartureId(departureId);
      
      if (!userChecklist) {
        await Swal.fire({
          icon: "warning",
          title: "체크리스트를 먼저 생성하세요!",
          text: "적금 플랜을 만들기 전에 먼저 체크리스트를 생성해주세요.",
          confirmButtonText: "체크리스트 만들기",
          showCancelButton: true,
          cancelButtonText: "취소",
        }).then((result) => {
          if (result.isConfirmed) {
            navigate("/checklist/new");
          }
        });
        return;
      }
      
      // 체크리스트가 있으면 적금 플랜 페이지로 이동 (체크리스트 정보와 함께)
      navigate("/savings/plan", { 
        state: { 
          checklistId: userChecklist.userChecklistId,
          checklistTitle: userChecklist.title,
          departureId: departureId
        }
      });
      
    } catch (error) {
      console.error('체크리스트 확인 중 오류:', error);
      await Swal.fire({
        icon: "error",
        title: "오류 발생",
        text: "체크리스트 확인 중 오류가 발생했습니다. 다시 시도해주세요.",
        confirmButtonText: "확인",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleCreate = () => {
    if (onCreate) {
      onCreate();
    } else {
      checkUserChecklist();
    }
  };

  return (
    <section className={`${styles.wrap} ${className || ""}`}>
      <img
        className={styles.bg}
        src={bg}
        alt="적금 플랜이 없을 때 표시되는 배경"
        draggable={false}
      />
      <div className={styles.overlay}>
        <h3 className={styles.title}>적금 플랜이 없습니다</h3>
        <button 
          className={styles.cta} 
          type="button" 
          onClick={handleCreate}
          disabled={isChecking}
        >
          {isChecking ? "확인 중..." : "플랜 만들기"}
        </button>
      </div>
    </section>
  );
}
