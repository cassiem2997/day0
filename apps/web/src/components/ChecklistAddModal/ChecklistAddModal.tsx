import Swal from "sweetalert2";

export interface AddChecklistItemData {
  title: string;
  tag: "NONE" | "SAVING" | "EXCHANGE" | "INSURANCE" | "DOCUMENT" | "ETC";
  dueDate?: string;
  linkedAmount?: number;
  isFixed?: boolean;
}

export default function openChecklistAddModal(): Promise<AddChecklistItemData | null> {
  return new Promise((resolve) => {
    const today = new Date().toISOString().split('T')[0];
    
    Swal.fire({
      width: 560,
      padding: 0,
      showConfirmButton: false,
      html: `
<div id="checklist-add-modal" style="font-family: 'EF_jejudoldam', system-ui, -apple-system, Segoe UI, Roboto, 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;">
  <div style="margin: 18px; background:#f3f9ff; border:4px solid #111; border-radius:18px; padding:22px 22px 26px;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
      <div style="background:#fff; border:4px solid #111; border-radius:999px; padding:10px 20px; font-weight:900; font-size:22px;">항목 추가</div>
      <button id="close-modal" style="background:#fff; border:3px solid #111; border-radius:50%; width:40px; height:40px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:900;">×</button>
    </div>

    <!-- Row: 구분 -->
    <div style="display:flex; align-items:center; gap:16px; margin-bottom:14px;">
      <div style="min-width:92px; text-align:center; background:#4758FC; color:#fff; border:4px solid #111; border-radius:24px; padding:10px 14px; font-weight:900; font-size:18px;">구분</div>
      <div style="flex:1; background:#fff; border:4px solid #111; border-radius:18px; padding:10px;">
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          <button class="tag-btn" data-tag="SAVING" style="background:#fff; border:3px solid #111; border-radius:20px; padding:8px 16px; font-weight:900; cursor:pointer; font-size:14px;">적금</button>
          <button class="tag-btn" data-tag="DOCUMENT" style="background:#fff; border:3px solid #111; border-radius:20px; padding:8px 16px; font-weight:900; cursor:pointer; font-size:14px;">서류</button>
          <button class="tag-btn" data-tag="EXCHANGE" style="background:#fff; border:3px solid #111; border-radius:20px; padding:8px 16px; font-weight:900; cursor:pointer; font-size:14px;">환전</button>
          <button class="tag-btn" data-tag="INSURANCE" style="background:#fff; border:3px solid #111; border-radius:20px; padding:8px 16px; font-weight:900; cursor:pointer; font-size:14px;">보험</button>
          <button class="tag-btn" data-tag="ETC" style="background:#fff; border:3px solid #111; border-radius:20px; padding:8px 16px; font-weight:900; cursor:pointer; font-size:14px;">기타</button>
        </div>
      </div>
    </div>

    <!-- Row: 기한 -->
    <div style="display:flex; align-items:center; gap:16px; margin-bottom:14px;">
      <div style="min-width:92px; text-align:center; background:#4758FC; color:#fff; border:4px solid #111; border-radius:24px; padding:10px 14px; font-weight:900; font-size:18px;">기한</div>
      <input id="due-date" type="date" value="${today}" style="flex:1; height:56px; border:4px solid #111; border-radius:18px; background:#fff; padding:0 16px; font-weight:900; font-size:16px; outline:none;" />
    </div>

    <!-- Row: 항목 -->
    <div style="display:flex; align-items:flex-start; gap:16px; margin-bottom:18px;">
      <div style="min-width:92px; text-align:center; background:#4758FC; color:#fff; border:4px solid #111; border-radius:24px; padding:10px 14px; font-weight:900; font-size:18px;">항목</div>
      <textarea id="item-title" placeholder="항목을 추가합니다." style="flex:1; height:120px; border:4px solid #111; border-radius:18px; background:#fff; padding:12px 16px; font-weight:500; font-size:16px; outline:none; resize:none; box-sizing:border-box;"></textarea>
    </div>

    <div style="display:flex; justify-content:center; gap:12px;">
      <button id="cancel-btn" style="border:none; cursor:pointer; padding:12px 24px; border-radius:999px; background:#fff; color:#111; font-weight:900; font-size:18px; box-shadow:0 4px 0 #111; border:3px solid #111;">취소</button>
      <button id="submit-btn" style="border:none; cursor:pointer; padding:12px 24px; border-radius:999px; background:#4758FC; color:#fff; font-weight:900; font-size:18px; box-shadow:0 4px 0 #111; border:3px solid #111;">추가하기</button>
    </div>
  </div>
</div>
      `,
      didOpen: () => {
        let selectedTag: string = "ETC"; // 기본값
        
        const tagButtons = document.querySelectorAll('.tag-btn');
        const dueDateEl = document.getElementById('due-date') as HTMLInputElement;
        const titleEl = document.getElementById('item-title') as HTMLTextAreaElement;
        const submitEl = document.getElementById('submit-btn') as HTMLButtonElement;
        const cancelEl = document.getElementById('cancel-btn') as HTMLButtonElement;
        const closeEl = document.getElementById('close-modal') as HTMLButtonElement;

        // 기본 선택된 태그 스타일 적용
        const defaultTag = document.querySelector('[data-tag="ETC"]') as HTMLButtonElement;
        if (defaultTag) {
          defaultTag.style.background = '#4758FC';
          defaultTag.style.color = '#fff';
        }

        // 태그 선택 이벤트
        tagButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            // 모든 버튼 초기화
            tagButtons.forEach(b => {
              (b as HTMLElement).style.background = '#fff';
              (b as HTMLElement).style.color = '#111';
            });
            
            // 선택된 버튼 스타일 적용
            (btn as HTMLElement).style.background = '#4758FC';
            (btn as HTMLElement).style.color = '#fff';
            
            selectedTag = btn.getAttribute('data-tag') || 'ETC';
          });
        });

        const handleSubmit = () => {
          const title = titleEl.value.trim();
          const dueDate = dueDateEl.value;
          
          if (!title) {
            Swal.fire({
              icon: "warning",
              title: "항목명을 입력하세요",
              text: "추가할 항목의 내용을 입력해 주세요.",
              confirmButtonText: "확인",
            });
            return;
          }

          // ISO 형식으로 변환 (날짜만 있는 경우 시간을 00:00:00으로 설정)
          const isoDate = dueDate ? new Date(dueDate + 'T00:00:00.000Z').toISOString() : undefined;
          
          resolve({
            title,
            tag: selectedTag as "NONE" | "SAVING" | "EXCHANGE" | "INSURANCE" | "DOCUMENT" | "ETC",
            dueDate: isoDate,
            linkedAmount: 0,
            isFixed: true
          });
          
          Swal.close();
        };

        const handleCancel = () => {
          resolve(null);
          Swal.close();
        };

        submitEl.addEventListener('click', handleSubmit);
        cancelEl.addEventListener('click', handleCancel);
        closeEl.addEventListener('click', handleCancel);
        
        // Enter 키 처리
        titleEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        });

        // 포커스를 제목 입력 필드로
        titleEl.focus();
      },
      willClose: () => {
        // 닫힐 때 null 반환 (취소된 경우)
        resolve(null);
      }
    });
  });
}
