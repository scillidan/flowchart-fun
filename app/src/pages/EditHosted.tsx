import * as Tabs from "@radix-ui/react-tabs";
import { Check, DotsThree } from "phosphor-react";
import { useCallback, useEffect } from "react";
import { useMutation, useQuery } from "react-query";
import { useLocation, useParams } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";

import { ClearTextButton } from "../components/ClearTextButton";
import EditorError from "../components/EditorError";
import { EditorOptions } from "../components/EditorOptions";
import { EditorWrapper } from "../components/EditorWrapper";
import { EditWrapper } from "../components/EditWrapper";
import Main from "../components/Main";
import Spinner from "../components/Spinner";
import { EditLayoutTab } from "../components/Tabs/EditLayoutTab";
import { EditorTabList } from "../components/Tabs/EditorTabList";
import { OnChange } from "@monaco-editor/react";

import { TextEditor } from "../components/TextEditor";
import { prepareChart } from "../lib/prepareChart/prepareChart";
import { getHostedChart, updateChartText } from "../lib/queries";
import { Doc, docToString, useDoc } from "../lib/useDoc";
import { useEditorStore } from "../lib/useEditorStore";
import { useTrackLastChart } from "../lib/useLastChart";
import sandboxStyles from "./Sandbox.module.css";
import styles from "./EditHosted.module.css";
import { useTabsStore } from "../lib/useTabsStore";
import EditStyleTab from "../components/Tabs/EditStyleTab";
import { useIsProUser } from "../lib/hooks";

export default function EditHosted() {
  const { id } = useParams<{ id: string }>();
  useQuery(["useHostedDoc", id], () => loadHostedDoc(id ?? ""), {
    enabled: !!id,
    suspense: true,
    staleTime: 0,
    cacheTime: 0,
  });

  const { mutate, isLoading } = useMutation((text: string) =>
    updateChartText(text, id)
  );
  // get debounced mutate
  const {
    callback: debounceMutate,
    flush,
    pending,
  } = useDebouncedCallback((doc: Doc) => {
    mutate(docToString(doc));
  }, 1000);
  useEffect(() => useDoc.subscribe(debounceMutate), [debounceMutate]);

  const text = useDoc((state) => state.text);

  // This is to make sure we update if people exit the tab quickly
  useEffect(() => {
    return () => {
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = useCallback<OnChange>(
    (value) => useDoc.setState({ text: value ?? "" }, false, "EditHosted/text"),
    []
  );

  const url = useLocation().pathname;
  useTrackLastChart(url);
  const isProUser = useIsProUser();

  const selectedTab = useTabsStore((s) => s.selectedTab);
  useEffect(() => {
    return () => {
      useTabsStore.setState({ selectedTab: "Document" });
    };
  }, []);

  return (
    <EditWrapper>
      <Main>
        <EditorWrapper>
          <Tabs.Root
            value={selectedTab}
            onValueChange={(selectedTab) => {
              useTabsStore.setState({ selectedTab });
            }}
            className={sandboxStyles.Tabs}
          >
            <EditorTabList />
            <Tabs.Content value="Document">
              <EditorOptions>
                <TextEditor
                  value={text}
                  onChange={onChange}
                  extendOptions={{
                    readOnly: !isProUser,
                  }}
                />
              </EditorOptions>
            </Tabs.Content>
            <Tabs.Content value="Layout">
              <EditLayoutTab />
            </Tabs.Content>
            <Tabs.Content value="Style">
              <EditStyleTab />
            </Tabs.Content>
          </Tabs.Root>
        </EditorWrapper>
        <LoadingState isLoading={isLoading} pending={pending()} />
        <ClearTextButton
          handleClear={() => {
            useDoc.setState({ text: "", meta: {} }, false, "EditHosted/clear");
            const editor = useEditorStore.getState().editor;
            if (!editor) return;
            editor.focus();
          }}
        />
        <EditorError />
      </Main>
    </EditWrapper>
  );
}

/**
 * Shows whether the chart has synced to the server
 */
function LoadingState({
  pending,
  isLoading,
}: {
  pending: boolean;
  isLoading: boolean;
}) {
  return (
    <div className={styles.LoadingState}>
      {pending ? (
        <DotsThree size={18} color="var(--palette-purple-0)" />
      ) : isLoading ? (
        <Spinner r={4} s={1} c="var(--palette-purple-0)" />
      ) : (
        <Check size={17} color="var(--palette-purple-0)" />
      )}
    </div>
  );
}

async function loadHostedDoc(id: string) {
  const chart = await getHostedChart(id);
  if (!chart) throw new Error("Chart not found");
  const doc = chart.chart;
  await prepareChart(doc, {
    id: chart.id,
    title: chart.name,
    isHosted: true,
    isPublic: chart.is_public,
    publicId: chart.public_id ?? undefined,
  });
  return doc;
}
