package com.travel0.day0.common.converter;

import com.travel0.day0.common.enums.FxDirection;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class FxDirectionConverter implements AttributeConverter<FxDirection, String> {

    @Override
    public String convertToDatabaseColumn(FxDirection attribute) {
        if (attribute == null) return null;
        return switch (attribute) {
            case GT  -> ">";
            case LT  -> "<";
            case GTE -> ">=";
            case LTE -> "<=";
        };
    }

    @Override
    public FxDirection convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        return switch (dbData) {
            case ">"  -> FxDirection.GT;
            case "<"  -> FxDirection.LT;
            case ">=" -> FxDirection.GTE;
            case "<=" -> FxDirection.LTE;
            default   -> throw new IllegalArgumentException("Unknown FX direction: " + dbData);
        };
    }
}
