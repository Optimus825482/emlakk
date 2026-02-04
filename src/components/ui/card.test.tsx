/**
 * Card Component Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";

describe("Card Component", () => {
  describe("Card", () => {
    it("renders with default styles", () => {
      // Arrange & Act
      render(<Card>Card content</Card>);

      // Assert
      const card = screen.getByText("Card content");
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass("rounded-lg", "border", "bg-card", "shadow-sm");
    });

    it("applies custom className", () => {
      // Arrange & Act
      render(<Card className="custom-card">Custom</Card>);

      // Assert
      expect(screen.getByText("Custom")).toHaveClass("custom-card");
    });

    it("forwards ref correctly", () => {
      // Arrange
      const ref = vi.fn<HTMLDivElement, null>();

      // Act
      render(<Card ref={ref}>Ref Card</Card>);

      // Assert
      expect(ref).toHaveBeenCalled();
    });
  });

  describe("CardHeader", () => {
    it("renders with default styles", () => {
      // Arrange & Act
      render(
        <CardHeader>
          <CardTitle>Header Title</CardTitle>
        </CardHeader>
      );

      // Assert
      const header = screen.getByText("Header Title").parentElement;
      expect(header).toHaveClass("p-6", "flex", "flex-col");
    });

    it("applies custom className", () => {
      // Arrange & Act
      render(<CardHeader className="custom-header">Header</CardHeader>);

      // Assert
      expect(screen.getByText("Header")).toHaveClass("custom-header");
    });
  });

  describe("CardTitle", () => {
    it("renders as h3 element", () => {
      // Arrange & Act
      render(<CardTitle>Card Title</CardTitle>);

      // Assert
      const title = screen.getByText("Card Title");
      expect(title.tagName).toBe("H3");
      expect(title).toHaveClass("text-2xl", "font-semibold");
    });

    it("applies custom className", () => {
      // Arrange & Act
      render(<CardTitle className="text-red-500">Custom Title</CardTitle>);

      // Assert
      expect(screen.getByText("Custom Title")).toHaveClass("text-red-500");
    });
  });

  describe("CardDescription", () => {
    it("renders as p element with muted text", () => {
      // Arrange & Act
      render(<CardDescription>Card description text</CardDescription>);

      // Assert
      const description = screen.getByText("Card description text");
      expect(description.tagName).toBe("P");
      expect(description).toHaveClass("text-sm", "text-muted-foreground");
    });
  });

  describe("CardContent", () => {
    it("renders with padding but no top padding", () => {
      // Arrange & Act
      render(<CardContent>Content area</CardContent>);

      // Assert
      const content = screen.getByText("Content area");
      expect(content).toHaveClass("p-6", "pt-0");
    });
  });

  describe("CardFooter", () => {
    it("renders with flex items alignment", () => {
      // Arrange & Act
      render(<CardFooter>Footer content</CardFooter>);

      // Assert
      const footer = screen.getByText("Footer content");
      expect(footer).toHaveClass("flex", "items-center", "p-6", "pt-0");
    });
  });

  describe("Complete Card Composition", () => {
    it("renders a complete card with all subcomponents", () => {
      // Arrange & Act
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>This is a test card</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      // Assert
      expect(screen.getByText("Test Card")).toBeInTheDocument();
      expect(screen.getByText("This is a test card")).toBeInTheDocument();
      expect(screen.getByText("Card content goes here")).toBeInTheDocument();
      expect(screen.getByText("Action")).toBeInTheDocument();

      const card = screen.getByTestId("complete-card");
      expect(card).toBeInTheDocument();
    });
  });
});
