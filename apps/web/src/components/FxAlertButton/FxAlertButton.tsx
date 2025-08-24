import Swal from "sweetalert2";
import styles from "./FxAlertButton.module.css";

type Direction = "at_or_below" | "at_or_above";

export default function FxAlertButton({
  baseCcy = "USD",
  quoteCcy = "KRW",
  current,
}: {
  baseCcy?: string;
  quoteCcy?: string;
  current?: number;
}) {
  const onClick = async () => {
    const { value, isConfirmed } = await Swal.fire<{
      cond: Direction;
      target: number;
    }>({
      title: "환율 알림 등록",
      html: `
        <div style="text-align:left">
          <div style="margin-bottom:10px;">
            <div style="font-size:12px;color:#6b7480;">통화쌍</div>
            <div style="font-weight:700">${baseCcy} → ${quoteCcy}</div>
          </div>
          <div style="margin-bottom:10px;">
            <div style="font-size:12px;color:#6b7480;">조건</div>
            <select id="fx-cond" class="swal2-input" style="width:100%;box-sizing:border-box;height:42px">
              <option value="at_or_below">이하로 떨어지면</option>
              <option value="at_or_above">이상으로 올라가면</option>
            </select>
          </div>
          <div>
            <div style="font-size:12px;color:#6b7480;">목표 환율</div>
            <input id="fx-target" type="number" step="0.01" min="0" class="swal2-input" style="width:100%;box-sizing:border-box" value="${
              current ?? ""
            }" placeholder="예: 1390" />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "등록",
      cancelButtonText: "취소",
      focusConfirm: false,
      preConfirm: () => {
        const condEl = document.getElementById(
          "fx-cond"
        ) as HTMLSelectElement | null;
        const targetEl = document.getElementById(
          "fx-target"
        ) as HTMLInputElement | null;
        const cond = (condEl?.value || "at_or_below") as Direction;
        const target = Number(targetEl?.value || "");
        if (!targetEl?.value || Number.isNaN(target) || target <= 0) {
          Swal.showValidationMessage("유효한 목표 환율을 입력하세요.");
          return;
        }
        return { cond, target };
      },
    });

    if (!isConfirmed || !value) return;

    // 연동 스텁
    console.log("[FX ALERT STUB]", {
      baseCcy,
      quoteCcy,
      direction: value.cond,
      target: value.target,
    });

    await Swal.fire({
      icon: "success",
      title: "알림 등록 완료",
      text: `${baseCcy}→${quoteCcy} ${
        value.cond === "at_or_below" ? "≤" : "≥"
      } ${value.target}로 알림을 설정했어요.`,
      confirmButtonText: "확인",
    });
  };

  return (
    <button type="button" className={styles.alertBtn} onClick={onClick}>
      <span className={styles.strokeText}>알림 등록</span>
    </button>
  );
}
