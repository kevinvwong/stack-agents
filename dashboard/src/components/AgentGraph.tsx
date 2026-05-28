import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge as FlowEdge,
  MarkerType,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  type AgentMeta,
  type Edge,
  FAMILY_COLORS,
  CHAINS,
} from "../data/agents";
import { FAMILY_NAMES } from "../families";

interface Props {
  agents: AgentMeta[];
  edges: Edge[];
  selectedAgent: string | null;
  onSelectAgent: (id: string | null) => void;
}

// Layout: arrange agents in rows by family
function layoutNodes(agents: AgentMeta[]): Node[] {
  const familyGroups: Record<string, AgentMeta[]> = {};
  for (const a of agents) {
    if (!familyGroups[a.family]) familyGroups[a.family] = [];
    familyGroups[a.family].push(a);
  }

  // Order families to match chain layout — canonical list in families.ts
  const familyOrder = FAMILY_NAMES;

  const nodes: Node[] = [];
  let yOffset = 0;
  const NODE_W = 160;
  const NODE_H = 60;
  const YGAP = 120;
  const XGAP = 180;

  for (const family of familyOrder) {
    const members = familyGroups[family];
    if (!members || members.length === 0) continue;

    // Order within chain families by chain order
    const chain = CHAINS.find((c) => c.family === family);
    if (chain) {
      const chainIdOf = (stem: string) => {
        const map: Record<string, string> = {
          "web-data": "data",
          "web-security": "security",
          "web-ai-llm": "ai-llm",
          "web-application": "application",
          "web-infrastructure": "infrastructure",
          "web-observability": "observability",
          "web-presentation": "presentation",
          "game-narrative": "narrative",
          "game-level-design": "level-design",
          "game-production": "production",
        };
        return map[stem] ?? stem;
      };
      members.sort((a, b) => {
        const ai = chain.chain.indexOf(chainIdOf(a.id));
        const bi = chain.chain.indexOf(chainIdOf(b.id));
        return ai - bi;
      });
    }

    members.forEach((agent, i) => {
      nodes.push({
        id: agent.id,
        type: "agentNode",
        position: { x: i * XGAP, y: yOffset },
        data: { agent },
        style: { width: NODE_W, height: NODE_H },
      });
    });
    yOffset += NODE_H + YGAP;
  }

  return nodes;
}

function AgentNode({
  data,
  selected,
}: {
  data: { agent: AgentMeta };
  selected: boolean;
}) {
  const { agent } = data;
  const color = FAMILY_COLORS[agent.family];
  return (
    <div
      style={{
        background: selected ? color : "#1e293b",
        border: `2px solid ${color}`,
        borderRadius: 8,
        padding: "8px 12px",
        color: selected ? "#fff" : "#e2e8f0",
        fontSize: 12,
        cursor: "pointer",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: color }}
      />
      <div
        style={{
          fontWeight: 700,
          fontSize: 11,
          color: selected ? "#fff" : color,
          marginBottom: 2,
        }}
      >
        {agent.family}
      </div>
      <div style={{ fontWeight: 600 }}>{agent.name}</div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: color }}
      />
    </div>
  );
}

const nodeTypes = { agentNode: AgentNode };

export function AgentGraph({
  agents,
  edges,
  selectedAgent,
  onSelectAgent,
}: Props) {
  const initialNodes = useMemo(() => layoutNodes(agents), [agents]);

  const initialEdges: FlowEdge[] = useMemo(
    () =>
      edges.map((e, i) => ({
        id: `e-${i}`,
        source: e.source,
        target: e.target,
        label: e.type === "handoff" ? "↗ handoff" : undefined,
        style: {
          stroke: e.type === "chain" ? "#94a3b8" : "#f59e0b",
          strokeDasharray: e.type === "handoff" ? "4 3" : undefined,
          strokeWidth: e.type === "chain" ? 2 : 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: e.type === "chain" ? "#94a3b8" : "#f59e0b",
        },
        labelStyle: { fill: "#f59e0b", fontSize: 10 },
        labelBgStyle: { fill: "#0f172a" },
      })),
    [edges],
  );

  const [nodes, , onNodesChange] = useNodesState(
    initialNodes.map((n) => ({ ...n, selected: n.id === selectedAgent })),
  );
  const [flowEdges, , onEdgesChange] = useEdgesState(initialEdges);

  // When an agent is selected, highlight its connected edges and dim the rest.
  // Connected = edge.source or edge.target matches selectedAgent.
  const styledEdges = useMemo(() => {
    if (!selectedAgent) return flowEdges;
    return flowEdges.map((edge) => {
      const isConnected =
        edge.source === selectedAgent || edge.target === selectedAgent;
      if (isConnected) {
        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: "#e2e8f0",
            opacity: 1,
            strokeWidth: 2,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#e2e8f0" },
        };
      }
      return {
        ...edge,
        style: { ...edge.style, opacity: 0.2 },
      };
    });
  }, [flowEdges, selectedAgent]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelectAgent(node.id === selectedAgent ? null : node.id);
    },
    [selectedAgent, onSelectAgent],
  );

  return (
    <div style={{ width: "100%", height: "100%", background: "#0f172a" }}>
      <ReactFlow
        nodes={nodes.map((n) => ({ ...n, selected: n.id === selectedAgent }))}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        colorMode="dark"
      >
        <Background color="#1e293b" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(n) =>
            FAMILY_COLORS[(n.data as { agent: AgentMeta }).agent.family] ??
            "#666"
          }
          maskColor="#0f172a99"
        />
      </ReactFlow>
    </div>
  );
}
