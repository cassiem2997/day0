import Swal from "sweetalert2";

// 출금 완료 모달을 표시하는 함수
export default function showWithdrawSuccessModal(
  itemTitle: string,
  amount: number
): Promise<void> {
  console.log('출금 성공 모달 표시:', { itemTitle, amount });
  return new Promise((resolve) => {
    // 금액 포맷팅 (3자리마다 콤마 추가)
    const formattedAmount = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    Swal.fire({
      width: 560,
      padding: 0,
      showConfirmButton: false,
      backdrop: true,
      html: `
<div id="withdraw-success-modal" style="font-family: 'EF_jejudoldam', system-ui, -apple-system, Segoe UI, Roboto, 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;">
  <div style="margin: 18px; background:#f3f9ff; border:4px solid #111; border-radius:18px; padding:22px 22px 26px;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
      <div style="background:#fff; border:4px solid #111; border-radius:999px; padding:10px 20px; font-weight:900; font-size:22px;">출금 완료</div>
      <button id="close-modal" style="background:#fff; border:3px solid #111; border-radius:50%; width:40px; height:40px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:900;">×</button>
    </div>

    <!-- 체크 아이콘 -->
    <div style="text-align:center; margin:20px 0;">
      <div style="display:inline-flex; justify-content:center; align-items:center; width:80px; height:80px; background:#4758FC; color:#fff; border:4px solid #111; border-radius:50%;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L9 17L4 12" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>

    <!-- 항목 제목 -->
    <div style="text-align:center; margin-bottom:16px;">
      <div style="font-weight:900; font-size:22px; color:#111; margin-bottom:6px;">항목 완료</div>
      <div style="font-weight:700; font-size:18px; color:#111; background:#fff; border:3px solid #111; border-radius:16px; padding:10px 16px; margin:0 auto; max-width:400px; word-break:break-all;">
        ${itemTitle}
      </div>
    </div>

    <!-- 출금 금액 -->
    <div style="text-align:center; margin-bottom:24px;">
      <div style="font-weight:900; font-size:18px; color:#111; margin-bottom:6px;">출금 금액</div>
      <div style="display:flex; align-items:center; justify-content:center; gap:8px;">
        <div style="font-weight:900; font-size:26px; color:#4758FC;">${formattedAmount}</div>
        <div style="font-weight:700; font-size:18px;">원</div>
      </div>
    </div>

    <!-- 확인 버튼 -->
    <div style="display:flex; justify-content:center;">
      <button id="confirm-btn" style="border:none; cursor:pointer; padding:12px 36px; border-radius:999px; background:#4758FC; color:#fff; font-weight:900; font-size:18px; box-shadow:0 4px 0 #111; border:3px solid #111;">확인</button>
    </div>
  </div>
</div>
      `,
      didOpen: () => {
        const confirmBtn = document.getElementById("confirm-btn") as HTMLButtonElement;
        const closeBtn = document.getElementById("close-modal") as HTMLButtonElement;

        const handleClose = () => {
          Swal.close();
          resolve();
        };

        confirmBtn.addEventListener("click", handleClose);
        closeBtn.addEventListener("click", handleClose);
      },
      willClose: () => {
        resolve();
      }
    });
  });
}
