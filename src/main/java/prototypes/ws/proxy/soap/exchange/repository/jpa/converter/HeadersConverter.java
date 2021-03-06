/*
 * Copyright 2014 JL06436S.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package prototypes.ws.proxy.soap.exchange.repository.jpa.converter;

import java.io.StringReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.json.Json;
import javax.json.JsonArrayBuilder;
import javax.json.JsonObjectBuilder;
import javax.json.JsonReader;
import javax.json.JsonStructure;
import javax.json.JsonValue;
import javax.persistence.AttributeConverter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import prototypes.ws.proxy.soap.commons.messages.Messages;

/**
 *
 * @author JL06436S
 */
public class HeadersConverter implements AttributeConverter<Map<String, List<String>>, byte[]> {

    private static final Logger LOGGER = LoggerFactory
            .getLogger(HeadersConverter.class);

    @Override
    public byte[] convertToDatabaseColumn(Map<String, List<String>> map) {
        LOGGER.debug("Convert headers to DB");
        if (map != null) {
            JsonObjectBuilder oBuilder = Json.createObjectBuilder();
            for (Map.Entry<String, List<String>> entry : map.entrySet()) {
                JsonArrayBuilder aBuilder = Json.createArrayBuilder();
                for (String value : entry.getValue()) {
                    aBuilder.add(value);
                }
                String compatKey = (entry.getKey() == null) ? "_" : entry.getKey();
                oBuilder.add(compatKey, aBuilder.build());
            }
            String finalColumnContent = oBuilder.build().toString();
            return (new CompressionConverter()).convertToDatabaseColumn(finalColumnContent);
        } else {
            return new byte[0];
        }
    }

    @Override
    public Map<String, List<String>> convertToEntityAttribute(byte[] dbData) {
        LOGGER.debug("Convert headers from DB");
        Map outMap = new HashMap<String, List<String>>();
        if (dbData != null && dbData.length > 0) {
            String dbDataString = (new CompressionConverter()).convertToEntityAttribute(dbData);
            JsonReader reader = Json.createReader(new StringReader(dbDataString));
            JsonStructure jsonst = reader.read();
            try {
                Map<String, JsonValue> jsonMap = (Map<String, JsonValue>) jsonst;
                for (Map.Entry<String, JsonValue> entry : jsonMap.entrySet()) {
                    List<String> list = new ArrayList<String>();
                    list.addAll((List) entry.getValue());
                    outMap.put(entry.getKey(), list);
                }
            } catch (ClassCastException ex) {
                LOGGER.warn(Messages.MSG_ERROR_ON, " DB column conversion - Bad class found ");
                LOGGER.debug(Messages.MSG_ERROR_DETAILS, ex);
            } catch (NullPointerException ex) {
                LOGGER.warn(Messages.MSG_ERROR_ON, " DB column conversion - Null found ");
                LOGGER.debug(Messages.MSG_ERROR_DETAILS, ex);
            }
        }
        return outMap;
    }

}
