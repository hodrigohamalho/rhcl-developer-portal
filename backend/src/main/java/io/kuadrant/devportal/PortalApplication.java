package io.kuadrant.devportal;

import org.eclipse.microprofile.openapi.annotations.OpenAPIDefinition;
import org.eclipse.microprofile.openapi.annotations.info.Contact;
import org.eclipse.microprofile.openapi.annotations.info.Info;

import jakarta.ws.rs.core.Application;

/** OpenAPI document metadata for the portal API (spec §6, §12). */
@OpenAPIDefinition(info = @Info(
        title = "Developer Portal API",
        version = "0.1.0",
        description = "API Management Developer Portal integrated with Red Hat Connectivity Link (RHCL / Kuadrant).",
        contact = @Contact(name = "RHCL PoC Team", email = "rhcl-poc@example.com")))
public class PortalApplication extends Application {
}
