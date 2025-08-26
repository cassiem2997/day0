package com.travel0.day0.savings.service;

import org.apache.coyote.BadRequestException;
import org.springframework.stereotype.Component;
import java.util.*;
import java.time.*;

@Component
public class ScheduleCalculator {

    private ScheduleCalculator() {}

    /** MONTHLY: depositDay(1~28). start/end는 Instant. 결과는 LocalDate 목록 */
    public static List<LocalDate> monthlyDates(Instant start, Instant end, Integer depositDay, ZoneId zone) throws BadRequestException {
        if (depositDay == null) throw new BadRequestException("depositDay required for MONTHLY");
        LocalDate s = LocalDateTime.ofInstant(start, zone).toLocalDate();
        LocalDate e = LocalDateTime.ofInstant(end,   zone).toLocalDate();
        List<LocalDate> out = new ArrayList<>();

        // 첫 회차 후보: 이번 달 depositDay (단, s 이전이면 다음 달)
        LocalDate first = s.withDayOfMonth(Math.min(depositDay, s.lengthOfMonth()));
        if (first.isBefore(s)) {
            LocalDate base = s.plusMonths(1);
            first = base.withDayOfMonth(Math.min(depositDay, base.lengthOfMonth()));
        }

        for (LocalDate d = first; !d.isAfter(e); d = d.plusMonths(1)) {
            int day = Math.min(depositDay, d.lengthOfMonth()); // (depositDay ≤ 28이면 사실상 그대로)
            LocalDate pay = d.withDayOfMonth(day);
            if (!pay.isBefore(s) && !pay.isAfter(e)) out.add(pay);
        }
        return out;
    }

    /** WEEKLY: depositWeekday(0=SUN..6=SAT). start/end는 Instant. 결과는 LocalDate 목록 */
    public static List<LocalDate> weeklyDates(Instant start, Instant end, Integer weekday0Sun, ZoneId zone) throws BadRequestException {
        if (weekday0Sun == null) throw new BadRequestException("depositWeekday required for WEEKLY");
        LocalDate s = LocalDateTime.ofInstant(start, zone).toLocalDate();
        LocalDate e = LocalDateTime.ofInstant(end,   zone).toLocalDate();
        DayOfWeek target = DayOfWeek.of(((weekday0Sun + 6) % 7) + 1); // 0=일→7, 1=월→1 ...

        int diff = (target.getValue() - s.getDayOfWeek().getValue() + 7) % 7;
        LocalDate first = s.plusDays(diff);

        List<LocalDate> out = new ArrayList<>();
        for (LocalDate d = first; !d.isAfter(e); d = d.plusWeeks(1)) {
            if (!d.isBefore(s)) out.add(d);
        }
        return out;
    }
}
