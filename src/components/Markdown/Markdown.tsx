import { Box } from "@chakra-ui/react";
import { Assembly } from "@jsii/spec";
import { FunctionComponent } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { Code } from "./Code";
import { Headings } from "./Headings";
import { Hr } from "./Hr";
import { Ul, Ol, Li } from "./List";
import { A, Blockquote, Em, P, Pre, Sup } from "./Text";

const components = {
  a: A,
  blockquote: Blockquote,
  code: Code,
  em: Em,
  h1: Headings,
  h2: Headings,
  h3: Headings,
  h4: Headings,
  h5: Headings,
  h6: Headings,
  hr: Hr,
  li: Li,
  ol: Ol,
  p: P,
  pre: Pre,
  sup: Sup,
  ul: Ul,
};

// Note - the default schema for rehypeSanitize is GitHub-style, which is what we need!
const rehypePlugins = [
  rehypeRaw,
  // ALWAYS keep rehypeSanitize LAST!
  rehypeSanitize,
];
const remarkPlugins = [remarkGfm];

const GITHUB_REPO_REGEX =
  /^(?:(?:git@)?github\.com:|(?:https?:\/\/)github\.com\/)([^/]+)\/([^/]+)(?:\.git)?$/;

/**
 * Parses out a GitHub repository owner and repo name from the `repository`
 * configuration of a jsii Assembly.
 *
 * @returns the `owner` and `repo` for the configured repository, if it looks
 *          like a GitHub repository URL.
 */
const parseGitHubRepository = ({ type, url }: Assembly["repository"]) => {
  if (type !== "git") {
    return undefined;
  }
  // git@github.com:<owner>/<repo>.git
  // https://github.com/<owner>/<repo>.git
  const match = GITHUB_REPO_REGEX.exec(url);
  if (match == null) {
    return undefined;
  }

  const [, owner, repo] = match;
  return { owner, repo };
};

export const Markdown: FunctionComponent<{
  children: string;
  repository: Assembly["repository"];
}> = ({ children, repository }) => {
  const repoConfig = parseGitHubRepository(repository);

  const toAbsoluteUri = (githubPrefix: string, githubSuffix = "HEAD") =>
    repoConfig == null
      ? ReactMarkdown.uriTransformer
      : (uri: string) => {
          const url = ReactMarkdown.uriTransformer(uri);

          // If this is an anchor or absolute URL, return it.
          const [first] = url;
          if (first === "#" || first === "/") {
            return url;
          }

          // If there is a protocol element, then return the URL as-is.
          if (url.includes("://")) {
            return url;
          }

          const { owner, repo } = repoConfig;
          return `https://${githubPrefix}/${owner}/${repo}/${githubSuffix}/${url}`;
        };

  return (
    <Box sx={{ "& > *": { mb: 4 } }}>
      <ReactMarkdown
        components={components}
        rehypePlugins={rehypePlugins}
        remarkPlugins={remarkPlugins}
        transformImageUri={toAbsoluteUri("raw.githubusercontent.com")}
        transformLinkUri={toAbsoluteUri("github.com", "blob/HEAD")}
      >
        {children}
      </ReactMarkdown>
    </Box>
  );
};