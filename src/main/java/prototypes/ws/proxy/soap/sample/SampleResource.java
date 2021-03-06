/*
 * Copyright 2014 jlamande.
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
package prototypes.ws.proxy.soap.sample;

import java.util.HashMap;
import java.util.Map;
import javax.servlet.ServletContext;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import prototypes.ws.proxy.soap.configuration.ProxyConfiguration;
import prototypes.ws.proxy.soap.web.context.ApplicationContext;

/**
 *
 * @author jlamande
 */
@Path("/sample")
//@Singleton // use of singleton and registering in App doesn't work
public class SampleResource {

    private final ProxyConfiguration proxyConfig;

    private static final Logger LOGGER = LoggerFactory
            .getLogger(SampleResource.class);

    // put map in static scope because on each request, SampleResource is a new instance
    // as Singleton doesnt work, see above
    private static final Map<String, Sample> samples = new HashMap<String, Sample>();

    @Context
    private UriInfo uriInfo;

    public SampleResource(@Context ServletContext context) {
        LOGGER.debug("SampleResource creation.");
        proxyConfig = ApplicationContext.getProxyConfiguration(context);
    }

    public void controlAccess() {
        if (!proxyConfig.runInDevMode()) {
            String msg = "This servlet can only be used in development mode.";
            LOGGER.warn("SampleResource access ERROR : {}", msg);
            throw new WebApplicationException(msg, 403);
        }
    }

    @GET
    @Path("/{name: [a-zA-Z][a-zA-Z_\\-0-9]*}")
    @Produces({MediaType.APPLICATION_JSON + ";charset=utf-8"})
    public Sample getSample(@PathParam("name") String sampleName) {
        LOGGER.debug("Hash {}", this.hashCode());
        controlAccess();
        LOGGER.debug("Ask for Sample [{}]", sampleName);
        Sample sample = this.samples.get(sampleName);
        if (sample == null) {
            LOGGER.debug("Sample not found in {}", samples);
            throw new WebApplicationException(404);
        }
        return sample;
    }

    @GET
    @Path("/{name: [a-zA-Z][a-zA-Z_\\-0-9]*}/content")
    @Produces({MediaType.APPLICATION_XML + ";charset=utf-8"})
    public String getRawSampleContent(@PathParam("name") String sampleName) {
        controlAccess();
        LOGGER.debug("Get raw sample");
        Sample sample = this.getSample(sampleName);
        return sample.getContent();
    }

    @POST
    @Path("/{name: [a-zA-Z][a-zA-Z_\\-0-9]*}/content")
    @Produces({MediaType.APPLICATION_XML})
    public Response postRawSampleContent(@PathParam("name") String sampleName) {
        LOGGER.debug("Act as a get raw sample");
        Sample sample = this.getSample(sampleName);
        // mimic the response code
        return Response.status(sample.getCode())
                .entity(sample.getContent()).build();
    }

    @POST
    @Consumes({MediaType.APPLICATION_JSON})
    public Response createSample(Sample sample) {
        LOGGER.debug("Hash {}", this.hashCode());
        controlAccess();
        Response response = null;
        if (sample != null) {
            LOGGER.debug("Create Sample [{}]", sample.getName());
            this.samples.put(sample.getName(), sample);

            response = Response.status(201)
                    .header(
                            "Location",
                            String.format(
                                    "%s/%s",
                                    uriInfo.getAbsolutePath().toString(),
                                    sample.getName()
                            )
                    )
                    .build();
        } else {
            LOGGER.debug("Bad Sample sent");
            response = Response.status(400).entity("Bad sample sent").build();
        }
        return response;
    }
}
