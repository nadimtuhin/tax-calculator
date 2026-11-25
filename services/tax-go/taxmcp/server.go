// Package taxmcp is the Go port of the public Bangladesh tax MCP server
// (packages/mcp/src/server.js and remote.js), built on the official go-sdk.
package taxmcp

import (
	"context"
	"strings"

	"github.com/modelcontextprotocol/go-sdk/jsonrpc"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

const (
	ServerName    = "bangladesh-tax-calculator"
	ServerVersion = "1.0.0"
)

// legacyProtocolVersions are the versions the JS SDK negotiates in the initialize handshake
// that go-sdk also supports. An unknown version is answered with the first one.
var legacyProtocolVersions = []string{"2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"}

var registeredTools = newTools()

func boolPtr(b bool) *bool { return &b }

// NewServer returns a go-sdk server exposing the four tax tools.
func NewServer() *mcp.Server {
	s := mcp.NewServer(&mcp.Implementation{Name: ServerName, Version: ServerVersion}, &mcp.ServerOptions{
		// Explicit, so go-sdk does not also advertise logging.
		Capabilities:              &mcp.ServerCapabilities{Tools: &mcp.ToolCapabilities{ListChanged: true}},
		SupportedProtocolVersions: legacyProtocolVersions,
	})
	known := map[string]bool{}
	for _, t := range registeredTools {
		known[t.def.Name] = true
		s.AddTool(&mcp.Tool{
			Name:        t.def.Name,
			Title:       t.def.Title,
			Description: t.def.Description,
			InputSchema: t.def.InputSchema,
			Annotations: &mcp.ToolAnnotations{
				ReadOnlyHint:    t.def.Annotations.ReadOnlyHint,
				DestructiveHint: boolPtr(t.def.Annotations.DestructiveHint),
				IdempotentHint:  t.def.Annotations.IdempotentHint,
				OpenWorldHint:   boolPtr(t.def.Annotations.OpenWorldHint),
			},
		}, toolHandler(t))
	}
	s.AddReceivingMiddleware(jsErrors(known))
	return s
}

func toolHandler(t tool) mcp.ToolHandler {
	return func(_ context.Context, req *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		text, isErr := t.call(req.Params.Arguments)
		return &mcp.CallToolResult{Content: []mcp.Content{&mcp.TextContent{Text: text}}, IsError: isErr}, nil
	}
}

// jsErrors makes go-sdk answer unknown methods and unknown tools with the JS server's errors.
func jsErrors(knownTools map[string]bool) mcp.Middleware {
	return func(next mcp.MethodHandler) mcp.MethodHandler {
		return func(ctx context.Context, method string, req mcp.Request) (mcp.Result, error) {
			switch {
			case method == "tools/call":
				if p, ok := req.(*mcp.CallToolRequest); ok && p.Params != nil && !knownTools[p.Params.Name] {
					return nil, &jsonrpc.Error{Code: jsonrpc.CodeInvalidParams, Message: "Tool " + p.Params.Name + " not found"}
				}
			case method == "initialize", method == "ping", method == "tools/list", strings.HasPrefix(method, "notifications/"):
			default:
				return nil, &jsonrpc.Error{Code: jsonrpc.CodeMethodNotFound, Message: "Method not found"}
			}
			return next(ctx, method, req)
		}
	}
}
