/**
 * Badge Component Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge Component", () => {
  it("renders with default props", () => {
    // Arrange & Act
    render(<Badge>New</Badge>);

    // Assert
    const badge = screen.getByText("New");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("rounded-full", "px-2.5", "py-0.5", "text-xs");
  });

  it("renders all variant styles", () => {
    // Arrange
    const { rerender } = render(<Badge variant="default">Default</Badge>);

    // Assert - default variant
    expect(screen.getByText("Default")).toHaveClass("bg-primary");

    // Act - secondary variant
    rerender(<Badge variant="secondary">Secondary</Badge>);
    expect(screen.getByText("Secondary")).toHaveClass("bg-secondary");

    // Act - destructive variant
    rerender(<Badge variant="destructive">Destructive</Badge>);
    expect(screen.getByText("Destructive")).toHaveClass("bg-destructive");

    // Act - outline variant
    rerender(<Badge variant="outline">Outline</Badge>);
    expect(screen.getByText("Outline")).toHaveClass("text-foreground");
  });

  it("applies custom className", () => {
    // Arrange & Act
    render(<Badge className="custom-badge">Custom</Badge>);

    // Assert
    expect(screen.getByText("Custom")).toHaveClass("custom-badge");
  });

  it("has inline-flex display", () => {
    // Arrange & Act
    render(<Badge>Inline Badge</Badge>);

    // Assert
    expect(screen.getByText("Inline Badge")).toHaveClass("inline-flex");
  });

  it("has font-semibold", () => {
    // Arrange & Act
    render(<Badge>Bold Badge</Badge>);

    // Assert
    expect(screen.getByText("Bold Badge")).toHaveClass("font-semibold");
  });

  it("has border styling", () => {
    // Arrange & Act
    render(<Badge>Bordered Badge</Badge>);

    // Assert
    expect(screen.getByText("Bordered Badge")).toHaveClass("border");
  });

  it("has focus ring styles", () => {
    // Arrange & Act
    render(<Badge>Focus Badge</Badge>);

    // Assert
    expect(screen.getByText("Focus Badge")).toHaveClass(
      "focus:outline-none",
      "focus:ring-2"
    );
  });

  it("renders with transition colors", () => {
    // Arrange & Act
    render(<Badge>Transition Badge</Badge>);

    // Assert
    expect(screen.getByText("Transition Badge")).toHaveClass(
      "transition-colors"
    );
  });

  it("renders long text content", () => {
    // Arrange & Act
    render(<Badge>Very Long Badge Content</Badge>);

    // Assert
    expect(screen.getByText("Very Long Badge Content")).toBeInTheDocument();
  });

  it("renders with special characters", () => {
    // Arrange & Act
    render(<Badge>Beta v2.0!</Badge>);

    // Assert
    expect(screen.getByText("Beta v2.0!")).toBeInTheDocument();
  });

  it("can be nested inside other elements", () => {
    // Arrange & Act
    render(
      <div>
        <h1>
          Title <Badge>New</Badge>
        </h1>
      </div>
    );

    // Assert
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
  });

  it("renders multiple badges", () => {
    // Arrange & Act
    render(
      <div>
        <Badge variant="default">Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
      </div>
    );

    // Assert
    expect(screen.getAllByText(/Default|Secondary|Destructive/)).toHaveLength(3);
  });
});
