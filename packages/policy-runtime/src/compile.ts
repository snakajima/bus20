import { fail, issue, type Issue, ok, type Result } from "@bus20/contracts/result";
import ts from "typescript";

/** The function a generated program must define at top level. */
export const DECIDE_FUNCTION = "decide" as const;

const FORBIDDEN_IDENTIFIERS = new Set(["require", "process", "globalThis", "eval", "Function"]);

const nodeIssue = (node: ts.Node): string | undefined => {
  if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node) || ts.isExportAssignment(node)) {
    return "imports and exports are not allowed";
  }
  if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
    return "dynamic import is not allowed";
  }
  if (ts.isIdentifier(node) && FORBIDDEN_IDENTIFIERS.has(node.text)) {
    return `identifier "${node.text}" is not allowed`;
  }
  return undefined;
};

const collectIssues = (source: ts.SourceFile): Issue[] => {
  const issues: Issue[] = [];
  const visit = (node: ts.Node): void => {
    const message = nodeIssue(node);
    if (message !== undefined) {
      issues.push(issue(String(node.getStart(source)), message));
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return issues;
};

const hasDecide = (source: ts.SourceFile): boolean =>
  source.statements.some(
    (statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === DECIDE_FUNCTION,
  );

/**
 * Static gate for generated programs: a single self-contained script that
 * defines `decide`, with no module system, no host access, and no dynamic
 * code. Then TypeScript is stripped to plain ES2022 JavaScript.
 */
export const compileProgram = (
  source: string,
  language: "typescript" | "javascript",
): Result<string> => {
  const kind = language === "typescript" ? ts.ScriptKind.TS : ts.ScriptKind.JS;
  const file = ts.createSourceFile("program.ts", source, ts.ScriptTarget.ES2022, true, kind);
  const issues = collectIssues(file);
  if (!hasDecide(file)) {
    issues.push(
      issue("", `program must declare a top-level function ${DECIDE_FUNCTION}(observation)`),
    );
  }
  return issues.length > 0 ? fail(issues) : transpile(source);
};

const transpile = (source: string): Result<string> => {
  const output = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022, strict: true },
    reportDiagnostics: true,
  });
  const diagnostics = (output.diagnostics ?? []).map((item) =>
    issue("", ts.flattenDiagnosticMessageText(item.messageText, "\n")),
  );
  return diagnostics.length > 0 ? fail(diagnostics) : ok(output.outputText);
};
