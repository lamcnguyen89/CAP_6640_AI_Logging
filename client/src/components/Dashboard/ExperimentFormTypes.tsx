export interface ExperimentBaseInfo {
  name: string; // The experiment's name
  nameError: string; // Error message for the name (i.e., invalid symbol, duplicate name, etc.)
  description: string; // The experiment's description
  descriptionError: string; // Error message for the description (i.e., invalid symbol, etc.)
  irbProtocolNumber: string; // The experiment's IRB protocol number
  irbProtocolNumberError: string; // Error message for the IRB protocol number (i.e., invalid symbol, etc.)
  irbEmailAddress: string; // The experiment's IRB email address
  irbEmailAddressError: string; // Error message for the IRB email address (i.e., invalid symbol, etc.)
  irbLetterName: string; // Name of IRB Letter File
  irbLetter: File; // Experiment's IRB approval letter in pdf format to be uploaded
  irbLetterDownload: string; // Experiment's IRB Approval letter sent from the server. It is Base64 format
  irbLetterError: string; // Error message for IRB letter upload
  draft: boolean; // Shows whether the experiment is a draft
  webxrZip: {
    data: Buffer; // The webxr zip file to be uploaded
    contentType: string; // The content type of the webxr zip file
    filename: string; // The filename of the webxr zip file
  };
}

export interface User {
  id: string; // The unique identifier for the user
  email: string; // The email of the user
  firstName: string; // The first name of the user
  lastName: string; // The last name of the user
  institution: {name: string}; // The institution of the user
  lab: {name: string}; // The lab of the user
}

export interface Collaborator {
  user: User;
  permissionRole: "Admin" | "Developer" | "Member"; // The permission role of the collaborator
  invalidError: string; // Error message for the collaborator (i.e., invalid symbol, duplicate email, etc.)
  needsUpdate: boolean; // Whether the collaborator has been updated, and has changes that need
}

export interface Condition {
  name: string;
  value: string;
}

export interface ConditionGroup {
  groupName: string;
  conditions: Condition[];
}

export interface Site {
  name: string; // Name of the site
  shortName: string; // Shorthand name of the site
  existingId: string; // The existing ID associated with the site (if linked via existing site / editing)
  invalidNameError: string; // Error message for the site name (i.e., invalid symbol, duplicate name, etc.)
  invalidShortNameError: string; // Error message for the site short name (i.e., invalid symbol, duplicate name, etc.)
  needsUpdate: boolean; // Whether the site has been updated, and has changes that need to be submitted with the form
}

export interface FileType {
  fileName: string; // The name of the file type
  fileExtension: string; // The associated extension of the file type
  fileDescription: string; // The description of the file type
  invalidFileNameError: string; // Error message for the file type name (i.e., invalid symbol, duplicate name, etc.)
  invalidFileExtensionError: string; // Error message for the file type extension (i.e., invalid symbol, etc.)
  invalidFileDescriptionError: string; // Error message for the file type description (i.e., invalid symbol, etc.)
  columnDefinition: ColumnDefinition; // The column definition associated with the file type (can be empty)
  existingId: string; // The existing ID associated with the file type (if linked via existing file type / editing)
  needsUpdate: boolean; // Whether the file type has been updated, and has changes that need to be submitted with the form
}

export interface ColumnDefinition {
  columns: Column[]; // The columns associated with the definition
  columnIdsToDelete: string[]; // The IDs of the columns to delete (if any)
  existingId: string; // The existing ID associated with the column definition (if linked via existing column definition / editing)
  needsUpdate: boolean; // Whether the column definition has been updated, and has changes that need to be submitted with the form
}

export interface Column {
  name: string; // The name of the column
  description: string; // The description of the column
  dataType: string; // The associated type of the column
  transform: string; // The associated transformation of the column
  existingId: string; // The existing ID associated with the column (if linked via existing column / editing)
  needsUpdate: boolean; // Whether the column has been updated, and has changes that need to be submitted with the form
}

export const getDefaultColumnDefinition = (): ColumnDefinition => {
  return {
    columns: [
      {
        name: "ts",
        description: "Time when the event occurred",
        dataType: "Date",
        transform: "None",
        existingId: undefined,
        needsUpdate: true,
      },
      {
        name: "eventId",
        description: "Unique identifier for each event",
        dataType: "String",
        transform: "None",
        existingId: undefined,
        needsUpdate: true,
      },
    ],
    columnIdsToDelete: [],
    existingId: "",
    needsUpdate: true,
  };
};

// List of C# keywords, which are "illegal" for file type names and column names
// This is to prevent issues when generating code in Unity, as these keywords are reserved in C#
const csharpKeywords = [
  "abstract",
  "add",
  "alias",
  "as",
  "ascending",
  "async",
  "await",
  "base",
  "bool",
  "break",
  "by",
  "byte",
  "case",
  "catch",
  "char",
  "checked",
  "class",
  "const",
  "continue",
  "decimal",
  "default",
  "delegate",
  "descending",
  "do",
  "double",
  "dynamic",
  "else",
  "enum",
  "event",
  "explicit",
  "extern",
  "false",
  "finally",
  "fixed",
  "float",
  "for",
  "foreach",
  "from",
  "get",
  "global",
  "goto",
  "group",
  "if",
  "implicit",
  "in",
  "int",
  "interface",
  "internal",
  "into",
  "is",
  "join",
  "let",
  "lock",
  "long",
  "nameof",
  "namespace",
  "new",
  "null",
  "object",
  "on",
  "operator",
  "orderby",
  "out",
  "override",
  "params",
  "partial",
  "private",
  "protected",
  "public",
  "readonly",
  "ref",
  "remove",
  "return",
  "sbyte",
  "sealed",
  "select",
  "set",
  "short",
  "sizeof",
  "stackalloc",
  "static",
  "string",
  "struct",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "uint",
  "ulong",
  "unchecked",
  "unsafe",
  "ushort",
  "using",
  "value",
  "var",
  "virtual",
  "void",
  "volatile",
  "where",
  "while",
  "yield",
];

const csharpKeywordsSet = new Set(csharpKeywords);
export const isCsharpKeyword = (word: string): boolean => {
  return csharpKeywordsSet.has(word.toLowerCase());
};
