import Swal from "sweetalert2";

// 금액 입력 모달을 띄우고 선택된 금액(원)을 number로 반환합니다. 취소/닫기 시 null 반환
export default function openChecklistAmountButton(defaultAmount: number = 5000): Promise<number | null> {
  return new Promise((resolve) => {
    const formatNumberWithCommas = (value: string | number): string => {
      const numeric = String(value).replace(/[^0-9]/g, "");
      if (!numeric) return "";
      return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const initial = formatNumberWithCommas(defaultAmount);

    Swal.fire({
      width: 620,
      padding: 0,
      showConfirmButton: false,
      backdrop: true,
      html: `
<div id="checklist-amount-modal" style="font-family: 'EF_jejudoldam', system-ui, -apple-system, Segoe UI, Roboto, 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;">
  <div style="margin: 18px; background:#f3f9ff; border:4px solid #111; border-radius:18px; padding:22px 22px 26px;">
    <div style="display:flex; justify-content:flex-end; align-items:center; margin-bottom:6px;">
      <button id="close-modal" style="background:#fff; border:3px solid #111; border-radius:50%; width:40px; height:40px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:900;">×</button>
    </div>

    <div style="text-align:center; margin-bottom:10px;">
      <div style="font-weight:900; font-size:34px; color:#4758FC; text-shadow:0 1px 0 #111;">체크리스트 생성 완료</div>
    </div>

    <div style="text-align:center; font-weight:900; font-size:20px; margin-bottom:24px;">체크리스트 항목당 미션 금액을 설정하세요.</div>

    <div style="display:flex; gap:16px; align-items:center; justify-content:center; margin-bottom:26px;">
      <div style="background:#4758FC; color:#fff; border:4px solid #111; border-radius:24px; padding:10px 20px; font-weight:900; font-size:20px; text-align:center;">금액</div>
      <div style="display:flex; align-items:center; gap:8px;">
        <input id="amount-input" inputmode="numeric" placeholder="0" value="${initial}"
          style="width:260px; border:4px solid #111; border-radius:24px; background:#fff; padding:12px 16px; font-weight:900; font-size:22px; outline:none; text-align:right;" />
        <span style="font-weight:900; font-size:22px;">원</span>
      </div>
    </div>

    <div style="display:flex; justify-content:center;">
      <button id="submit-btn" style="border:none; cursor:pointer; padding:12px 36px; border-radius:999px; background:#fff; color:#111; font-weight:900; font-size:20px; box-shadow:0 4px 0 #111; border:3px solid #111;">완료</button>
    </div>
  </div>
</div>
      `,
      didOpen: () => {
        const inputEl = document.getElementById("amount-input") as HTMLInputElement;
        const submitEl = document.getElementById("submit-btn") as HTMLButtonElement;
        const closeEl = document.getElementById("close-modal") as HTMLButtonElement;

        // 입력 시 숫자만 허용 + 3자리 콤마 포맷
        const handleFormat = () => {
          const raw = inputEl.value.replace(/[^0-9]/g, "");
          inputEl.value = formatNumberWithCommas(raw);
        };

        inputEl.addEventListener("input", handleFormat);

        const submit = () => {
          const numeric = inputEl.value.replace(/[^0-9]/g, "");
          const amount = Number(numeric || 0);

          if (amount <= 0) {
            Swal.fire({
              icon: "warning",
              title: "금액을 입력하세요",
              text: "1원 이상으로 설정해 주세요.",
              confirmButtonText: "확인",
            });
            return;
          }

          resolve(amount);
          Swal.close();
        };

        const cancel = () => {
          resolve(null);
          Swal.close();
        };

        submitEl.addEventListener("click", submit);
        closeEl.addEventListener("click", cancel);

        inputEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        });

        inputEl.focus();
        inputEl.select();
      },
      willClose: () => {
        // 사용자가 외부 클릭 등으로 닫은 경우 null 반환
        resolve(null);
      },
    });
  });
}


