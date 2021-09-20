import { ArrowUpRight, CirclesThree, IconProps } from "phosphor-react";
import { memo, ReactNode, useContext, useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import Select, { StylesConfig, SingleValueProps } from "react-select";
import { directions, layouts } from "../lib/graphOptions";
import { Box, Type } from "../slang";
import styles from "./GraphOptionsBar.module.css";
import { GraphContext } from "./GraphProvider";
import isEqual from "fast-deep-equal";

const GraphOptionsBar = memo(() => {
  const { updateGraphOptionsText, graphOptions } = useContext(GraphContext);

  const {
    watch,
    control,
    formState: { isDirty },
  } = useForm();

  const values = watch();
  const valuesString = JSON.stringify(values);

  useEffect(() => {
    // Check if different than current values
    if (isDirty) {
      const options = JSON.parse(valuesString);
      if (!isEqual(options, graphOptions)) {
        window.plausible("Update Graph Options", {
          props: {
            layoutName: options.layout.name,
            rankDir: options.layout.rankDir,
          },
        });
        updateGraphOptionsText && updateGraphOptionsText(options);
      }
    }
  }, [updateGraphOptionsText, isDirty, valuesString, graphOptions]);

  const selectedLayout = useMemo(
    () =>
      graphOptions.layout?.name
        ? layouts.find((l) => l.value === graphOptions.layout?.name)
        : layouts[0],
    [graphOptions.layout?.name]
  );

  const selectedDirection = useMemo(
    () =>
      (graphOptions.layout as any)?.rankDir
        ? directions.find(
            (l) => l.value === (graphOptions.layout as any)?.rankDir
          )
        : undefined,
    [graphOptions.layout]
  );

  return (
    <Box
      className={styles.GraphOptionsBar}
      p={2}
      px={4}
      flow="column"
      gap={4}
      content="normal start"
      items="center stretch"
      as="form"
    >
      <OptionWithIcon icon={CirclesThree}>
        <Controller
          control={control}
          name="layout.name"
          render={({ field: { onChange } }) => (
            <MySelect
              options={layouts}
              onChange={(layout: typeof layouts[0]) =>
                layout && onChange(layout.value)
              }
              value={selectedLayout}
            />
          )}
        />
      </OptionWithIcon>
      {graphOptions.layout?.name === "dagre" && (
        <OptionWithIcon icon={ArrowUpRight}>
          <Controller
            control={control}
            name="layout.rankDir"
            render={({ field: { onChange } }) => (
              <MySelect
                options={directions}
                onChange={(dir: typeof directions[0]) =>
                  dir && onChange(dir.value)
                }
                value={selectedDirection}
              />
            )}
          />
        </OptionWithIcon>
      )}
    </Box>
  );
});

GraphOptionsBar.displayName = "GraphOptionsBar";
export default GraphOptionsBar;

type Icon = React.ForwardRefExoticComponent<
  IconProps & React.RefAttributes<SVGSVGElement>
>;

function OptionWithIcon({
  icon: Icon,
  children,
}: {
  icon: Icon;
  children: ReactNode;
}) {
  return (
    <Box flow="column" gap={2} items="center normal">
      <Icon />
      {children}
    </Box>
  );
}

const selectStyles: StylesConfig<any, false> = {
  control: (p, { isFocused }) => {
    return {
      ...p,
      border: `solid 1px ${
        isFocused ? "var(--color-edgeHover)" : "var(--color-uiAccent)"
      }`,
      backgroundColor: "var(--color-background)",
      boxShadow: "none",
      transition: "none",
      cursor: "pointer",
      "&:hover": {
        borderColor: "var(--color-edgeHover)",
        "& [class*='indicatorContainer'] svg path": {
          fill: "var(--color-edgeHover)",
        },
      },
    };
  },
  placeholder: (provided) => ({
    ...provided,
    position: "static",
    transform: "none",
  }),
  singleValue: (provided) => ({
    ...provided,
    position: "static",
    transform: "none",
    marginLeft: 0,
    marginRight: 0,
    maxWidth: "100%",
    color: "var(--color-foreground)",
  }),
  valueContainer: (z) => ({
    ...z,
    paddingInline: "calc(var(--spacer-px) * 2)",
    paddingBlock: "calc(var(--spacer-py) * 1)",
  }),
  indicatorsContainer: (z) => ({
    ...z,
    padding: "calc(var(--spacer-px) * 1)",
  }),
  dropdownIndicator: (z, { isFocused }) => ({
    ...z,
    padding: 0,
    transition: "none",
    path: {
      fill: isFocused ? "var(--color-edgeHover)" : "var(--color-uiAccent)",
    },
  }),
  menu: (z) => ({
    ...z,
    backgroundColor: "var(--color-background)",
    border: "solid 1px var(--color-uiAccent)",
    boxShadow: "none",
    width: 200,
  }),
};

function MySelect(props: any) {
  return (
    <Select
      {...props}
      isSearchable={false}
      getOptionLabel={({ label }) => (label as unknown as () => string)()}
      styles={selectStyles}
      components={{
        IndicatorSeparator: () => null,
        SingleValue,
        Option,
        DownChevron: CaretDown,
      }}
    />
  );
}

const SingleValue = ({ children }: SingleValueProps<any>) => (
  <Type size={-1}>{children}</Type>
);
const Option = ({
  children,
  innerProps,
  innerRef,
  isSelected,
  isFocused,
}: any) => {
  return (
    <Box
      className={styles.Option}
      ref={innerRef}
      px={2}
      py={1}
      {...innerProps}
      aria-selected={isSelected}
      data-focused={isFocused}
    >
      <Type size={-1}>{children}</Type>
    </Box>
  );
};

function CaretDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={17} height={17} xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill="none" fillRule="evenodd">
        <path d="M0 0h17v17H0z" />
        <path
          stroke="#000"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14 6l-5.5 5L3 6"
        />
      </g>
    </svg>
  );
}
