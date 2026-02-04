/**
 * Input Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./input";

describe("Input Component", () => {
  it("renders with default props", () => {
    // Arrange & Act
    render(<Input />);

    // Assert
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass("h-10", "w-full", "rounded-md", "border");
  });

  it("renders with placeholder", () => {
    // Arrange & Act
    render(<Input placeholder="Enter text..." />);

    // Assert
    expect(screen.getByPlaceholderText("Enter text...")).toBeInTheDocument();
  });

  it("renders different input types", () => {
    // Arrange & Act - text type (default)
    const { rerender, container } = render(<Input type="text" />);
    let input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("type", "text");

    // Act - email type
    rerender(<Input type="email" />);
    input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("type", "email");

    // Act - password type (no textbox role, use querySelector)
    rerender(<Input type="password" />);
    const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute("type", "password");

    // Act - number type (spinbutton role)
    rerender(<Input type="number" />);
    input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("type", "number");
  });

  it("handles user input", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Input placeholder="Test input" />);

    // Act
    const input = screen.getByPlaceholderText("Test input");
    await user.type(input, "Hello World");

    // Assert
    expect(input).toHaveValue("Hello World");
  });

  it("calls onChange callback", async () => {
    // Arrange
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Input onChange={handleChange} />);

    // Act
    const input = screen.getByRole("textbox");
    await user.type(input, "test");

    // Assert
    expect(handleChange).toHaveBeenCalled();
  });

  it("is disabled when disabled prop is true", () => {
    // Arrange & Act
    render(<Input disabled />);

    // Assert
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
    expect(input).toHaveClass("disabled:opacity-50", "disabled:cursor-not-allowed");
  });

  it("applies custom className", () => {
    // Arrange & Act
    render(<Input className="custom-input" />);

    // Assert
    expect(screen.getByRole("textbox")).toHaveClass("custom-input");
  });

  it("forwards ref correctly", () => {
    // Arrange
    const ref = vi.fn<HTMLInputElement, null>();

    // Act
    render(<Input ref={ref} />);

    // Assert
    expect(ref).toHaveBeenCalled();
    const inputElement = ref.mock.calls[0][0];
    expect(inputElement).toBeInstanceOf(HTMLInputElement);
  });

  it("has focus-visible styles", () => {
    // Arrange & Act
    render(<Input />);

    // Assert
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass(
      "focus-visible:outline-none",
      "focus-visible:ring-2",
      "focus-visible:ring-ring"
    );
  });

  it("handles value prop (controlled input)", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Input value="Initial value" onChange={vi.fn()} />);

    // Assert
    const input = screen.getByDisplayValue("Initial value");
    expect(input).toBeInTheDocument();

    // Act - trying to type in controlled input without updating onChange
    await user.type(input, " more text");

    // Value should remain the same since onChange doesn't update state
    expect(input).toHaveValue("Initial value");
  });

  it("has accessible name via label", () => {
    // Arrange & Act
    render(
      <label htmlFor="test-input">
        Test Label
        <Input id="test-input" />
      </label>
    );

    // Assert
    expect(screen.getByRole("textbox", { name: "Test Label" })).toBeInTheDocument();
  });

  it("renders with min, max, and step props", () => {
    // Arrange & Act
    render(<Input type="number" min="0" max="100" step="5" />);

    // Assert - number inputs have spinbutton role
    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("max", "100");
    expect(input).toHaveAttribute("step", "5");
  });
});
