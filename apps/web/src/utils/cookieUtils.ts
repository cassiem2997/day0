// src/utils/cookieUtils.ts
/**
 * 쿠키 값을 가져오는 함수 (개선된 버전)
 * @param name 쿠키 이름
 * @returns 쿠키 값 또는 null
 */
export function getCookie(name: string): string | null {
  // 방법 1: 기존 방식 ('; ' 구분자 사용)
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift();
      if (cookieValue && cookieValue !== "undefined" && cookieValue !== "null") {
        console.log(`🍪 getCookie(${name}) 방법1 성공:`, cookieValue.substring(0, 20) + (cookieValue.length > 20 ? "..." : ""));
        return cookieValue;
      }
    }
  } catch (e) {
    console.error("getCookie 방법1 오류:", e);
  }
  
  // 방법 2: 직접 파싱 (더 안정적인 방법)
  try {
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
      if (cookie.startsWith(`${name}=`)) {
        const cookieValue = cookie.split('=')[1];
        if (cookieValue && cookieValue !== "undefined" && cookieValue !== "null") {
          console.log(`🍪 getCookie(${name}) 방법2 성공:`, cookieValue.substring(0, 20) + (cookieValue.length > 20 ? "..." : ""));
          return cookieValue;
        }
      }
    }
  } catch (e) {
    console.error("getCookie 방법2 오류:", e);
  }
  
  console.log(`🍪 getCookie(${name}) 실패: 쿠키를 찾을 수 없음`);
  return null;
}

/**
 * 쿠키를 설정하는 함수 (개선된 버전)
 * @param name 쿠키 이름
 * @param value 쿠키 값
 * @param days 유효기간 (일)
 * @param secure HTTPS에서만 사용 여부
 * @param sameSite SameSite 정책
 */
export function setCookie(
  name: string, 
  value: string, 
  days: number = 7,
  secure: boolean = false,
  sameSite: 'Strict' | 'Lax' | 'None' = 'Lax'
): void {
  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    
    let cookieString = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    
    // SameSite 설정
    cookieString += `;SameSite=${sameSite}`;
    
    // Secure 설정 (HTTPS에서만 사용)
    if (secure || sameSite === 'None') {
      cookieString += ';Secure';
    }
    
    document.cookie = cookieString;
    console.log(`🍪 setCookie(${name}) 성공:`, value.substring(0, 20) + (value.length > 20 ? "..." : ""));
    
    // 설정 후 확인
    setTimeout(() => {
      const check = getCookie(name);
      if (check) {
        console.log(`🍪 setCookie(${name}) 확인 성공`);
      } else {
        console.warn(`🍪 setCookie(${name}) 확인 실패: 쿠키가 설정되지 않았습니다`);
      }
    }, 100);
  } catch (e) {
    console.error("setCookie 오류:", e);
  }
}

/**
 * 쿠키를 삭제하는 함수
 * @param name 쿠키 이름
 */
export function deleteCookie(name: string): void {
  try {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    console.log(`🍪 deleteCookie(${name}) 성공`);
    
    // 삭제 후 확인
    setTimeout(() => {
      const check = getCookie(name);
      if (!check) {
        console.log(`🍪 deleteCookie(${name}) 확인 성공`);
      } else {
        console.warn(`🍪 deleteCookie(${name}) 확인 실패: 쿠키가 여전히 존재합니다`);
      }
    }, 100);
  } catch (e) {
    console.error("deleteCookie 오류:", e);
  }
}
