package fr.erdf.nsge.sgel.proxy.soap.xml;

import org.junit.Test;
import prototypes.ws.proxy.soap.xml.XmlUtils;

public class XmlUtilsTest {

    @Test
    public void test() {
        String str = "<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\">\r\n"
                + "   <soapenv:Header/>\r\n"
                + "   <soapenv:Body>\r\n"
                + "   </soapenv:Body>\r\n" + "</soapenv:Envelope>";
        // bypass first one
        XmlUtils.cleanXmlRequest(str);
        for (int i = 0; i < 1; i++) {
            long start = System.currentTimeMillis();
            XmlUtils.cleanXmlRequest(str);
            System.out
                    .println("Time : " + (System.currentTimeMillis() - start));
            str = new StringBuilder(str).toString();
        }
    }
}
