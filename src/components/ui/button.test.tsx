/**
 * Button Component Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button Component", () => {
  it("renders with default props", () => {
    // Arrange & Act
    render(<Button>Click me</Button>);

    // Assert
    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-primary");
  });

  it("renders with text content", () => {
    // Arrange & Act
    render(<Button>Submit</Button>);

    // Assert
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
  });

  it("renders all variant styles", () => {
    // Arrange & Act
    const { rerender } = render(<Button variant="default">Default</Button>);

    // Assert - default variant
    expect(screen.getByRole("button")).toHaveClass("bg-primary");

    // Act - destructive variant
    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-destructive");

    // Act - outline variant
    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button")).toHaveClass("border", "border-input");

    // Act - secondary variant
    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-secondary");

    // Act - ghost variant
    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole("button")).toHaveClass("hover:bg-accent");

    // Act - link variant
    rerender(<Button variant="link">Link</Button>);
    expect(screen.getByRole("button")).toHaveClass("hover:underline", "text-primary", "underline-offset-4");
  });

  it("renders all size variants", () => {
    // Arrange & Act
    const { rerender } = render(<Button size="default">Default</Button>);

    // Assert - default size
    expect(screen.getByRole("button")).toHaveClass("h-10", "px-4");

    // Act - small size
    rerender(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-9", "px-3");

    // Act - large size
    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-11", "px-8");

    // Act - icon size
    rerender(<Button size="icon">Icon</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-10", "w-10");
  });

  it("handles click events", async () => {
    // Arrange
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Click me</Button>);

    // Act
    await user.click(screen.getByRole("button"));

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    // Arrange & Act
    render(<Button disabled>Disabled</Button>);

    // Assert
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:opacity-50");
  });

  it("applies custom className", () => {
    // Arrange & Act
    render(<Button className="custom-class">Custom</Button>);

    // Assert
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("forwards ref correctly", () => {
    // Arrange
    const ref = vi.fn<HTMLButtonElement, null>();

    // Act
    render(<Button ref={ref}>Ref Button</Button>);

    // Assert
    expect(ref).toHaveBeenCalled();
    const buttonElement = ref.mock.calls[0][0];
    expect(buttonElement).toBeInstanceOf(HTMLButtonElement);
  });

  it("renders as child component when asChild is true", () => {
    // Arrange & Act
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );

    // Assert
    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
  });

  it("has accessible name", () => {
    // Arrange & Act
    render(<Button>Accessible Button</Button>);

    // Assert
    expect(screen.getByRole("button", { name: "Accessible Button" })).toBeInTheDocument();
  });

  it("applies focus-visible classes", () => {
    // Arrange & Act
    render(<Button>Focus Test</Button>);

    // Assert
    const button = screen.getByRole("button");
    expect(button).toHaveClass("focus-visible:outline-none", "focus-visible:ring-2");
  });
});
